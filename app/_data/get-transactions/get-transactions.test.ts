import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseTransactionsSearchParams } from "./search-params";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  count: vi.fn(),
  findMany: vi.fn(),
  groupBy: vi.fn(),
  aggregate: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/app/_lib/prisma", () => ({
  db: {
    transaction: {
      count: mocks.count,
      findMany: mocks.findMany,
      groupBy: mocks.groupBy,
      aggregate: mocks.aggregate,
    },
  },
}));

import { getTransactions } from "./index";

describe("parseTransactionsSearchParams", () => {
  it("usa os padrões quando a URL está vazia", () => {
    expect(parseTransactionsSearchParams({})).toEqual({
      page: 1,
      pageSize: 10,
      name: undefined,
      type: [],
      category: [],
      paymentMethod: [],
      from: undefined,
      to: undefined,
      sort: "date",
      order: "desc",
    });
  });

  it("lê filtros válidos e descarta valores inválidos", () => {
    const params = parseTransactionsSearchParams({
      page: "3",
      pageSize: "20",
      name: "  mercado ",
      type: "EXPENSE,INVALIDO",
      category: "FOOD,HOUSING",
      paymentMethod: "PIX",
      from: "2026-01-01",
      to: "31/01/2026",
      sort: "amount",
      order: "asc",
    });

    expect(params).toMatchObject({
      page: 3,
      pageSize: 20,
      name: "mercado",
      type: ["EXPENSE"],
      category: ["FOOD", "HOUSING"],
      paymentMethod: ["PIX"],
      from: "2026-01-01",
      to: undefined,
      sort: "amount",
      order: "asc",
    });
  });

  it("volta para o padrão em página, tamanho e ordenação inválidos", () => {
    expect(
      parseTransactionsSearchParams({
        page: "-2",
        pageSize: "999",
        sort: "userId",
        order: "x",
      }),
    ).toMatchObject({ page: 1, pageSize: 10, sort: "date", order: "desc" });
  });
});

describe("getTransactions", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.count.mockResolvedValue(45);
    mocks.findMany.mockResolvedValue([]);
    mocks.groupBy.mockResolvedValue([]);
    mocks.aggregate.mockResolvedValue({
      _min: { date: null },
      _max: { date: null },
    });
  });

  it("recusa usuário não autenticado", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    await expect(
      getTransactions(parseTransactionsSearchParams({})),
    ).rejects.toThrow("Unauthorized");
  });

  it("pagina, ordena e filtra no banco, sempre pelo usuário", async () => {
    const result = await getTransactions(
      parseTransactionsSearchParams({
        page: "2",
        pageSize: "20",
        name: "mercado",
        category: "FOOD",
        from: "2026-01-01",
        to: "2026-01-31",
        sort: "amount",
        order: "asc",
      }),
    );

    const expectedWhere = {
      userId: "user_1",
      name: { contains: "mercado", mode: "insensitive" },
      date: {
        gte: new Date(2026, 0, 1, 0, 0, 0, 0),
        lte: new Date(2026, 0, 31, 23, 59, 59, 999),
      },
      category: { in: ["FOOD"] },
    };

    expect(mocks.count).toHaveBeenCalledWith({ where: expectedWhere });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: expectedWhere,
      orderBy: [{ amount: "asc" }, { createdAt: "desc" }],
      skip: 20,
      take: 20,
    });
    expect(result).toMatchObject({ total: 45, page: 2, pageCount: 3 });
  });

  it("mostra a última página quando a página pedida passou do fim", async () => {
    mocks.count.mockResolvedValue(12);

    const result = await getTransactions(
      parseTransactionsSearchParams({ page: "9" }),
    );

    expect(result).toMatchObject({ page: 2, pageCount: 2 });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it("conta cada opção de filtro sem aplicar o próprio filtro", async () => {
    mocks.groupBy.mockImplementation(({ by }: { by: string[] }) =>
      Promise.resolve(
        by[0] === "category"
          ? [
              { category: "FOOD", _count: { _all: 3 } },
              { category: "HOUSING", _count: { _all: 1 } },
            ]
          : [],
      ),
    );

    const result = await getTransactions(
      parseTransactionsSearchParams({ category: "FOOD", type: "EXPENSE" }),
    );

    const categoryCall = mocks.groupBy.mock.calls.find(
      ([args]) => args.by[0] === "category",
    )?.[0];

    // A contagem de categorias respeita o filtro de tipo, mas não o de categoria.
    expect(categoryCall.where).toEqual({
      userId: "user_1",
      type: { in: ["EXPENSE"] },
    });
    expect(result.facets.category).toEqual({ FOOD: 3, HOUSING: 1 });
  });
});
