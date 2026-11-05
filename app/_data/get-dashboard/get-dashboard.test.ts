import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  groupBy: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/app/_lib/prisma", () => ({
  db: { transaction: { groupBy: mocks.groupBy, findMany: mocks.findMany } },
}));

import { getDashboard } from "./index";

describe("getDashboard", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.findMany.mockResolvedValue([]);
  });

  it("calcula totais, saldo e percentuais", async () => {
    mocks.groupBy
      // por tipo
      .mockResolvedValueOnce([
        { type: "DEPOSIT", _sum: { amount: 1000 } },
        { type: "EXPENSE", _sum: { amount: 600 } },
        { type: "INVESTMENT", _sum: { amount: 400 } },
      ])
      // despesas por categoria
      .mockResolvedValueOnce([
        { category: "FOOD", _sum: { amount: 150 } },
        { category: "HOUSING", _sum: { amount: 450 } },
      ]);

    const dashboard = await getDashboard("02", 2026);

    expect(dashboard.depositsTotal).toBe(1000);
    expect(dashboard.expensesTotal).toBe(600);
    expect(dashboard.investmentsTotal).toBe(400);
    expect(dashboard.balance).toBe(0);
    expect(dashboard.typesPercentage).toEqual({
      DEPOSIT: 50,
      EXPENSE: 30,
      INVESTMENT: 20,
    });
    expect(dashboard.totalExpensePerCategory).toEqual([
      { category: "HOUSING", totalAmount: 450, percentageOfTotal: 75 },
      { category: "FOOD", totalAmount: 150, percentageOfTotal: 25 },
    ]);
  });

  it("retorna zeros (sem NaN) quando não há transações", async () => {
    mocks.groupBy.mockResolvedValue([]);

    const dashboard = await getDashboard("02", 2026);

    expect(dashboard.balance).toBe(0);
    expect(dashboard.typesPercentage).toEqual({
      DEPOSIT: 0,
      EXPENSE: 0,
      INVESTMENT: 0,
    });
    expect(dashboard.totalExpensePerCategory).toEqual([]);
  });

  it("filtra pelo usuário e pelo mês inteiro", async () => {
    mocks.groupBy.mockResolvedValue([]);

    await getDashboard("04", 2026);

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user_1",
          date: {
            gte: new Date(2026, 3, 1, 0, 0, 0, 0),
            lte: new Date(2026, 3, 30, 23, 59, 59, 999),
          },
        },
      }),
    );
  });
});
