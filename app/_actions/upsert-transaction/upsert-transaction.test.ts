import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  canUserAddTransaction: vi.fn(),
  updateMany: vi.fn(),
  create: vi.fn(),
  getBudgetAlert: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/_lib/budgets/alert", () => ({
  getBudgetAlert: mocks.getBudgetAlert,
}));
vi.mock("@/app/_data/can-user-add-transaction", () => ({
  FREE_PLAN_MONTHLY_TRANSACTIONS_LIMIT: 10,
  canUserAddTransaction: mocks.canUserAddTransaction,
}));
vi.mock("@/app/_lib/prisma", () => ({
  db: {
    transaction: { updateMany: mocks.updateMany, create: mocks.create },
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
});
