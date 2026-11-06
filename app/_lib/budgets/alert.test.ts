import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBudgetsForMonth: vi.fn(),
  aggregate: vi.fn(),
}));

vi.mock("./queries", () => ({ getBudgetsForMonth: mocks.getBudgetsForMonth }));
vi.mock("@/app/_lib/prisma", () => ({
  db: { transaction: { aggregate: mocks.aggregate } },
}));

import { getBudgetAlert } from "./alert";

const expense = {
  type: "EXPENSE" as const,
  category: "FOOD" as const,
  date: new Date(2026, 10, 20),
};

describe("getBudgetAlert", () => {
  beforeEach(() => {
    mocks.getBudgetsForMonth.mockResolvedValue({
      effective: { FOOD: 800 },
      base: { FOOD: 800 },
    });
    mocks.aggregate.mockResolvedValue({ _sum: { amount: 850 } });
  });

  it("avisa quando a despesa faz a categoria passar do orçamento do mês", async () => {
    expect(await getBudgetAlert("user_1", expense)).toEqual({
      category: "FOOD",
      spent: 850,
      budget: 800,
      month: 11,
      year: 2026,
    });
    expect(mocks.getBudgetsForMonth).toHaveBeenCalledWith("user_1", 11, 2026);
    expect(mocks.aggregate).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        category: "FOOD",
        type: "EXPENSE",
        date: {
          gte: new Date(2026, 10, 1, 0, 0, 0, 0),
          lte: new Date(2026, 10, 30, 23, 59, 59, 999),
        },
      },
      _sum: { amount: true },
    });
  });

  it("não avisa dentro do orçamento (inclusive exatamente no limite)", async () => {
    mocks.aggregate.mockResolvedValue({ _sum: { amount: 800 } });

    expect(await getBudgetAlert("user_1", expense)).toBeNull();
  });

  it("não avisa para categorias sem orçamento nem para receitas", async () => {
    mocks.getBudgetsForMonth.mockResolvedValue({ effective: {}, base: {} });

    expect(await getBudgetAlert("user_1", expense)).toBeNull();
    expect(
      await getBudgetAlert("user_1", { ...expense, type: "DEPOSIT" }),
    ).toBeNull();
  });

  it("não quebra o salvamento se a verificação falhar", async () => {
    mocks.aggregate.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await getBudgetAlert("user_1", expense)).toBeNull();
  });
});
