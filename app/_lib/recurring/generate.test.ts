import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  createMany: vi.fn((args: unknown) => ({ op: "createMany", args })),
  update: vi.fn((args: unknown) => ({ op: "update", args })),
  transaction: vi.fn(),
}));

vi.mock("@/app/_lib/prisma", () => ({
  db: {
    recurringTransaction: { findMany: mocks.findMany, update: mocks.update },
    transaction: { createMany: mocks.createMany },
    $transaction: mocks.transaction,
  },
}));

import { generateDueRecurringTransactions } from "./generate";

const day = (year: number, month: number, d: number) =>
  new Date(year, month - 1, d, 12, 0, 0, 0);

const rent = {
  id: "rec_1",
  userId: "user_1",
  name: "Aluguel",
  type: "EXPENSE",
  amount: 1800,
  category: "HOUSING",
  paymentMethod: "PIX",
  dayOfMonth: 10,
  startDate: day(2026, 11, 10),
  endDate: null,
  lastGeneratedAt: day(2026, 11, 10),
};

describe("generateDueRecurringTransactions", () => {
  beforeEach(() => {
    mocks.findMany.mockResolvedValue([rent]);
    mocks.transaction.mockImplementation(
      async (ops: { args: { data: unknown[] } }[]) => [
        { count: ops[0].args.data.length },
        {},
      ],
    );
  });

  it("busca só as recorrências do usuário que ainda não geraram o mês atual", async () => {
    await generateDueRecurringTransactions("user_1", day(2027, 1, 5));

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        OR: [
          { lastGeneratedAt: null },
          { lastGeneratedAt: { lt: new Date(2027, 0, 1) } },
        ],
      },
    });
  });

  it("cria as transações que faltam, ligadas à recorrência, e avança o marcador", async () => {
    const created = await generateDueRecurringTransactions(
      "user_1",
      day(2027, 1, 5),
    );

    expect(created).toBe(2);
    expect(mocks.createMany).toHaveBeenCalledWith({
      data: [day(2026, 12, 10), day(2027, 1, 10)].map((date) => ({
        userId: "user_1",
        name: "Aluguel",
        type: "EXPENSE",
        amount: 1800,
        category: "HOUSING",
        paymentMethod: "PIX",
        date,
        recurringTransactionId: "rec_1",
      })),
      skipDuplicates: true,
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "rec_1" },
      data: { lastGeneratedAt: day(2027, 1, 10) },
    });
  });

  it("não escreve nada quando não há meses pendentes", async () => {
    const created = await generateDueRecurringTransactions(
      "user_1",
      day(2026, 11, 20),
    );

    expect(created).toBe(0);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
