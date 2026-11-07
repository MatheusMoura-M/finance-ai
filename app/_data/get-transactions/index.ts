import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  TransactionsFilterField,
  TransactionsSearchParams,
} from "./search-params";
import { buildTransactionsWhere } from "./where";

export type TransactionsFacets = Record<
  TransactionsFilterField,
  Record<string, number>
>;

const toCountMap = <K extends string>(
  rows: ({ _count: { _all: number } } & Record<K, string>)[],
  key: K,
) =>
  Object.fromEntries(rows.map((row) => [row[key], row._count._all])) as Record<
    string,
    number
  >;

/**
 * Transações do usuário logado com filtros, ordenação e paginação feitos no
 * banco. Também devolve as contagens de cada opção de filtro (considerando os
 * demais filtros) e as datas da transação mais antiga/mais recente.
 */
export const getTransactions = async (params: TransactionsSearchParams) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { page, pageSize, sort, order } = params;

  const { where, whereWithout } = buildTransactionsWhere(userId, params);

  const total = await db.transaction.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Se a página pedida passou do fim (ex.: depois de apagar), mostra a última.
  const currentPage = Math.min(page, pageCount);

  const [transactions, typeCounts, categoryCounts, paymentMethodCounts, dates] =
    await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: [{ [sort]: order }, { createdAt: "desc" }],
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
      db.transaction.groupBy({
        by: ["type"],
        where: whereWithout("type"),
        _count: { _all: true },
      }),
      db.transaction.groupBy({
        by: ["category"],
        where: whereWithout("category"),
        _count: { _all: true },
      }),
      db.transaction.groupBy({
        by: ["paymentMethod"],
        where: whereWithout("paymentMethod"),
        _count: { _all: true },
      }),
      db.transaction.aggregate({
        where: { userId },
        _min: { date: true },
        _max: { date: true },
      }),
    ]);

  const facets: TransactionsFacets = {
    type: toCountMap(typeCounts, "type"),
    category: toCountMap(categoryCounts, "category"),
    paymentMethod: toCountMap(paymentMethodCounts, "paymentMethod"),
  };

  return {
    transactions: JSON.parse(
      JSON.stringify(transactions),
    ) as typeof transactions,
    total,
    page: currentPage,
    pageCount,
    facets,
    oldestTransactionDate:
      dates._min.date ?? new Date(new Date().getFullYear(), 0, 1),
    newestTransactionDate: dates._max.date ?? new Date(),
  };
};
