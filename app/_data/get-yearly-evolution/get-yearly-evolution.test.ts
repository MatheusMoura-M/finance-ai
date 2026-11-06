import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/app/_lib/prisma", () => ({
  db: { transaction: { findMany: mocks.findMany } },
}));

import { getYearlyEvolution } from "./index";

describe("getYearlyEvolution", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.findMany.mockResolvedValue([]);
  });

  it("recusa usuário não autenticado", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    await expect(getYearlyEvolution(2026)).rejects.toThrow("Unauthorized");
  });

  it("busca só as transações do usuário no ano inteiro", async () => {
    await getYearlyEvolution(2026);

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        date: {
          gte: new Date(2026, 0, 1, 0, 0, 0, 0),
          lte: new Date(2026, 11, 31, 23, 59, 59, 999),
        },
      },
      select: { date: true, type: true, amount: true },
    });
  });

  it("devolve os 12 meses, com zero nos meses sem transações", async () => {
    const months = await getYearlyEvolution(2026);

    expect(months).toHaveLength(12);
    expect(months.map((month) => month.month)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(months[5]).toEqual({
      month: 6,
      deposits: 0,
      expenses: 0,
      investments: 0,
      balance: 0,
    });
  });

  it("soma por mês e tipo e calcula o saldo", async () => {
    mocks.findMany.mockResolvedValue([
      { date: new Date(2026, 0, 5), type: "DEPOSIT", amount: 5000 },
      { date: new Date(2026, 0, 10), type: "EXPENSE", amount: 0.1 },
      { date: new Date(2026, 0, 31), type: "EXPENSE", amount: 0.2 },
      { date: new Date(2026, 0, 20), type: "INVESTMENT", amount: 1000 },
      { date: new Date(2026, 1, 1), type: "EXPENSE", amount: 300 },
    ]);

    const months = await getYearlyEvolution(2026);

    expect(months[0]).toEqual({
      month: 1,
      deposits: 5000,
      expenses: 0.3,
      investments: 1000,
      balance: 3999.7,
    });
    expect(months[1]).toMatchObject({ expenses: 300, balance: -300 });
  });
});
