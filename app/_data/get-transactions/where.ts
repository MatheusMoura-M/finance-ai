import { Prisma } from "@prisma/client";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import {
  TransactionsFilterField,
  TransactionsSearchParams,
} from "./search-params";

/**
 * Filtros do Prisma a partir dos parâmetros da tela de transações. Usado pela
 * tabela (getTransactions) e pela exportação em CSV, para exportar exatamente
 * o que está filtrado na tela. Sempre restrito ao usuário.
 */
export const buildTransactionsWhere = (
  userId: string,
  params: Pick<
    TransactionsSearchParams,
    "name" | "from" | "to" | "type" | "category" | "paymentMethod"
  >,
) => {
  const { name, from, to } = params;

  // Filtros que valem para tudo (inclusive para as contagens das facetas).
  const baseWhere: Prisma.TransactionWhereInput = {
    userId,
    ...(name && { name: { contains: name, mode: "insensitive" } }),
    ...((from || to) && {
      date: {
        ...(from && { gte: startOfDay(parseISO(from)) }),
        ...(to && { lte: endOfDay(parseISO(to)) }),
      },
    }),
  };

  const facetFilters: Record<
    TransactionsFilterField,
    Prisma.TransactionWhereInput
  > = {
    type: params.type.length ? { type: { in: params.type } } : {},
    category: params.category.length
      ? { category: { in: params.category } }
      : {},
    paymentMethod: params.paymentMethod.length
      ? { paymentMethod: { in: params.paymentMethod } }
      : {},
  };

  // Para contar as opções de um filtro, aplica todos os outros filtros menos ele.
  const whereWithout = (
    field: TransactionsFilterField,
  ): Prisma.TransactionWhereInput => ({
    ...baseWhere,
    ...Object.entries(facetFilters)
      .filter(([key]) => key !== field)
      .reduce((acc, [, filter]) => ({ ...acc, ...filter }), {}),
  });

  const where: Prisma.TransactionWhereInput = {
    ...baseWhere,
    ...facetFilters.type,
    ...facetFilters.category,
    ...facetFilters.paymentMethod,
  };

  return { where, whereWithout };
};
