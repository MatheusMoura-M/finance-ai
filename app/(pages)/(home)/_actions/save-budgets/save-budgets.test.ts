import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getBudgetsForMonth: vi.fn(),
  deleteMany: vi.fn((args: unknown) => ({ op: "deleteMany", args })),
  upsert: vi.fn((args: unknown) => ({ op: "upsert", args })),
  transaction: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/_lib/budgets/queries", () => ({
  getBudgetsForMonth: mocks.getBudgetsForMonth,
}));
vi.mock("@/app/_lib/prisma", () => ({
  db: {
    budget: { deleteMany: mocks.deleteMany, upsert: mocks.upsert },
    $transaction: mocks.transaction,
  },
}));

import { saveBudgets } from "./index";

const key = (category: string, onlyThisMonth: boolean) => ({
  userId_category_year_month_onlyThisMonth: {
    userId: "user_1",
    category,
    year: 2026,
    month: 12,
    onlyThisMonth,
  },
});

const ops = () => mocks.transaction.mock.calls[0]?.[0] ?? [];

describe("saveBudgets", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    // Dezembro: Alimentação tem R$ 800 "a partir de" um mês anterior.
    mocks.getBudgetsForMonth.mockResolvedValue({
      effective: { FOOD: 800 },
      base: { FOOD: 800 },
    });
    mocks.transaction.mockResolvedValue([]);
  });

  it("recusa usuário não autenticado", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const result = await saveBudgets({
      month: 12,
      year: 2026,
      scope: "fromThisMonth",
      budgets: [{ category: "FOOD", amount: 900 }],
    });

    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("recusa valores negativos", async () => {
    const result = await saveBudgets({
      month: 12,
      year: 2026,
      scope: "fromThisMonth",
      budgets: [{ category: "FOOD", amount: -10 }],
    });

    expect(result).toEqual({ success: false, error: "Dados inválidos." });
  });

  it("não grava nada quando nenhum valor mudou", async () => {
    await saveBudgets({
      month: 12,
      year: 2026,
      scope: "fromThisMonth",
      budgets: [
        { category: "FOOD", amount: 800 },
        { category: "TRAVEL", amount: null },
      ],
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("'a partir deste mês' grava o novo valor e remove o ajuste do mês", async () => {
    await saveBudgets({
      month: 12,
      year: 2026,
      scope: "fromThisMonth",
      budgets: [{ category: "FOOD", amount: 1000 }],
    });

    expect(ops()).toEqual([
      {
        op: "deleteMany",
        args: {
          where: {
            userId: "user_1",
            category: "FOOD",
            year: 2026,
            month: 12,
            onlyThisMonth: true,
          },
        },
      },
      {
        op: "upsert",
        args: {
          where: key("FOOD", false),
          create: {
            userId: "user_1",
            category: "FOOD",
            year: 2026,
            month: 12,
            amount: 1000,
          },
          update: { amount: 1000 },
        },
      },
    ]);
  });

  it("'a partir deste mês' com campo vazio remove o orçamento daqui pra frente", async () => {
    await saveBudgets({
      month: 12,
      year: 2026,
      scope: "fromThisMonth",
      budgets: [{ category: "FOOD", amount: null }],
    });

    expect(ops()[1]).toMatchObject({
      op: "upsert",
      args: { where: key("FOOD", false), update: { amount: null } },
    });
  });

  it("'só neste mês' grava um ajuste apenas para o mês", async () => {
    await saveBudgets({
      month: 12,
      year: 2026,
      scope: "onlyThisMonth",
      budgets: [{ category: "FOOD", amount: 1200 }],
    });

    expect(ops()).toEqual([
      {
        op: "upsert",
        args: {
          where: key("FOOD", true),
          create: {
            userId: "user_1",
            category: "FOOD",
            year: 2026,
            month: 12,
            amount: 1200,
            onlyThisMonth: true,
          },
          update: { amount: 1200 },
        },
      },
    ]);
  });

  it("'só neste mês' com o mesmo valor do mês padrão remove o ajuste", async () => {
    mocks.getBudgetsForMonth.mockResolvedValue({
      effective: { FOOD: 1200 },
      base: { FOOD: 800 },
    });

    await saveBudgets({
      month: 12,
      year: 2026,
      scope: "onlyThisMonth",
      budgets: [{ category: "FOOD", amount: 800 }],
    });

    expect(ops()).toEqual([
      expect.objectContaining({
        op: "deleteMany",
        args: {
          where: expect.objectContaining({
            category: "FOOD",
            onlyThisMonth: true,
          }),
        },
      }),
    ]);
  });
});
