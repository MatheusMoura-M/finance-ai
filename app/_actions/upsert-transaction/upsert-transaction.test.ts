import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  canUserAddTransaction: vi.fn(),
  updateMany: vi.fn(),
  create: vi.fn(),
  getBudgetAlert: vi.fn(),
  getUserSubscription: vi.fn(),
  createRecurring: vi.fn(),
  generateDue: vi.fn(),
  createMany: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/_data/get-user-subscription", () => ({
  getUserSubscription: mocks.getUserSubscription,
}));
vi.mock("@/app/_lib/recurring/generate", () => ({
  generateDueRecurringTransactions: mocks.generateDue,
}));
vi.mock("@/app/_lib/budgets/alert", () => ({
  getBudgetAlert: mocks.getBudgetAlert,
}));
vi.mock("@/app/_data/can-user-add-transaction", () => ({
  FREE_PLAN_MONTHLY_TRANSACTIONS_LIMIT: 10,
  canUserAddTransaction: mocks.canUserAddTransaction,
}));
vi.mock("@/app/_lib/prisma", () => ({
  db: {
    transaction: {
      updateMany: mocks.updateMany,
      create: mocks.create,
      createMany: mocks.createMany,
    },
    recurringTransaction: { create: mocks.createRecurring },
  },
}));

import { upsertTransaction } from "./index";

const TRANSACTION_ID = "6f1c2b9e-3a4d-4c5e-8f7a-1b2c3d4e5f60";

const validTransaction = {
  name: "Mercado",
  amount: 150.5,
  type: "EXPENSE" as const,
  category: "FOOD" as const,
  paymentMethod: "PIX" as const,
  date: new Date(2026, 10, 4),
};

describe("upsertTransaction", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.canUserAddTransaction.mockResolvedValue(true);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.create.mockResolvedValue({});
    mocks.getBudgetAlert.mockResolvedValue(null);
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: true,
    });
    mocks.createRecurring.mockResolvedValue({});
    mocks.generateDue.mockResolvedValue(0);
    mocks.createMany.mockResolvedValue({ count: 0 });
  });

  it("recusa usuário não autenticado", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const result = await upsertTransaction(validTransaction);

    expect(result).toEqual({
      success: false,
      error: "Você precisa estar logado.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("recusa dados inválidos", async () => {
    const result = await upsertTransaction({ ...validTransaction, amount: -1 });

    expect(result).toEqual({ success: false, error: "Dados inválidos." });
  });

  it("cria a transação com o userId da sessão", async () => {
    const result = await upsertTransaction(validTransaction);

    expect(result).toEqual({ success: true, data: { budgetAlert: null } });
    expect(mocks.create).toHaveBeenCalledWith({
      data: { ...validTransaction, userId: "user_1" },
    });
  });

  it("bloqueia a criação quando o limite do plano grátis foi atingido", async () => {
    mocks.canUserAddTransaction.mockResolvedValue(false);

    const result = await upsertTransaction(validTransaction);

    expect(result.success).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("edita apenas transações do próprio usuário", async () => {
    await upsertTransaction({ ...validTransaction, id: TRANSACTION_ID });

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: TRANSACTION_ID, userId: "user_1" },
      data: validTransaction,
    });
    expect(mocks.canUserAddTransaction).not.toHaveBeenCalled();
  });

  it("retorna erro ao editar transação de outro usuário", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const result = await upsertTransaction({
      ...validTransaction,
      id: TRANSACTION_ID,
    });

    expect(result).toEqual({
      success: false,
      error: "Transação não encontrada.",
    });
  });

  it("devolve o aviso de orçamento estourado junto com o sucesso", async () => {
    const alert = {
      category: "FOOD",
      spent: 850,
      budget: 800,
      month: 11,
      year: 2026,
    };
    mocks.getBudgetAlert.mockResolvedValue(alert);

    const result = await upsertTransaction(validTransaction);

    expect(mocks.getBudgetAlert).toHaveBeenCalledWith(
      "user_1",
      validTransaction,
    );
    expect(result).toEqual({ success: true, data: { budgetAlert: alert } });
  });

  describe("repetir todo mês", () => {
    it("cria a recorrência com a transação do mês ligada e preenche meses passados", async () => {
      const result = await upsertTransaction({
        ...validTransaction,
        repeatMonthly: true,
      });

      expect(result.success).toBe(true);
      expect(mocks.create).not.toHaveBeenCalled();
      expect(mocks.createRecurring).toHaveBeenCalledWith({
        data: {
          userId: "user_1",
          name: "Mercado",
          type: "EXPENSE",
          amount: 150.5,
          category: "FOOD",
          paymentMethod: "PIX",
          dayOfMonth: 4,
          startDate: validTransaction.date,
          lastGeneratedAt: validTransaction.date,
          transactions: { create: { ...validTransaction, userId: "user_1" } },
        },
      });
      expect(mocks.generateDue).toHaveBeenCalledWith("user_1");
    });

    it("é exclusivo do Plano Premium", async () => {
      mocks.getUserSubscription.mockResolvedValue({
        userId: "user_1",
        hasPremiumPlan: false,
      });

      const result = await upsertTransaction({
        ...validTransaction,
        repeatMonthly: true,
      });

      expect(result).toEqual({
        success: false,
        error: "Repetir todo mês é um recurso do Plano Premium.",
      });
      expect(mocks.createRecurring).not.toHaveBeenCalled();
    });

    it("é ignorado ao editar (editar muda só aquela transação)", async () => {
      await upsertTransaction({
        ...validTransaction,
        id: TRANSACTION_ID,
        repeatMonthly: true,
      });

      expect(mocks.updateMany).toHaveBeenCalled();
      expect(mocks.createRecurring).not.toHaveBeenCalled();
    });
  });

  describe("parcelamento", () => {
    const purchase = {
      ...validTransaction,
      name: "TV",
      amount: 100,
      paymentMethod: "CREDIT_CARD" as const,
      date: new Date(2026, 10, 15),
    };

    it("cria todas as parcelas de uma vez, ligadas pelo mesmo grupo", async () => {
      const result = await upsertTransaction({ ...purchase, installments: 3 });

      expect(result.success).toBe(true);
      expect(mocks.create).not.toHaveBeenCalled();

      const { data } = mocks.createMany.mock.calls[0][0];
      const groupIds = new Set(
        data.map(
          (row: { installmentGroupId: string }) => row.installmentGroupId,
        ),
      );

      expect(groupIds.size).toBe(1);
      expect(data).toEqual([
        expect.objectContaining({
          name: "TV (1/3)",
          amount: 33.34,
          date: new Date(2026, 10, 15),
          installmentNumber: 1,
          installmentTotal: 3,
          userId: "user_1",
          category: "FOOD",
          paymentMethod: "CREDIT_CARD",
        }),
        expect.objectContaining({
          name: "TV (2/3)",
          amount: 33.33,
          date: new Date(2026, 11, 15),
          installmentNumber: 2,
        }),
        expect.objectContaining({
          name: "TV (3/3)",
          amount: 33.33,
          date: new Date(2027, 0, 15),
          installmentNumber: 3,
        }),
      ]);
    });

    it("só aceita despesas no cartão de crédito", async () => {
      const result = await upsertTransaction({
        ...purchase,
        paymentMethod: "PIX",
        installments: 3,
      });

      expect(result).toEqual({
        success: false,
        error: "O parcelamento é só para despesas no cartão de crédito.",
      });
      expect(mocks.createMany).not.toHaveBeenCalled();
    });

    it("não combina parcelamento com repetir todo mês", async () => {
      const result = await upsertTransaction({
        ...purchase,
        installments: 3,
        repeatMonthly: true,
      });

      expect(result.success).toBe(false);
      expect(mocks.createMany).not.toHaveBeenCalled();
      expect(mocks.createRecurring).not.toHaveBeenCalled();
    });

    it("recusa mais de 24 parcelas", async () => {
      const result = await upsertTransaction({ ...purchase, installments: 25 });

      expect(result).toEqual({ success: false, error: "Dados inválidos." });
    });

    it("à vista (1 parcela) cria uma transação normal", async () => {
      await upsertTransaction({ ...purchase, installments: 1 });

      expect(mocks.create).toHaveBeenCalled();
      expect(mocks.createMany).not.toHaveBeenCalled();
    });
  });
});
