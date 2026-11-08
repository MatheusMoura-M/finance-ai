import { db } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import {
  TransactionsFilterField,
  TransactionsSearchParams,
} from "./search-params";

/** Tira acentos e deixa em minúsculas: "Água Café" -> "agua cafe". */
export const normalizeSearchText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

// Letras acentuadas e suas versões sem acento, na mesma posição, para o
// translate() do Postgres (nativo, não precisa da extensão unaccent).
export const ACCENTED_CHARS =
  "áàâãäåéèêëíìîïóòôõöúùûüçñýÿÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝ";
export const PLAIN_CHARS = [...ACCENTED_CHARS]
  .map(normalizeSearchText)
  .join("");

/** Escapa os curingas do LIKE (% e _) para buscar o texto literalmente. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

/**
 * IDs das transações do usuário cujo nome contém o termo, ignorando acentos e
 * maiúsculas ("agua" encontra "Água"). O Prisma não tem esse filtro, então a
 * comparação é feita em SQL e o resultado vira um filtro por id.
 */
const findTransactionIdsByName = async (userId: string, name: string) => {
  const pattern = `%${escapeLike(normalizeSearchText(name))}%`;

  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Transaction"
    WHERE "userId" = ${userId}
      AND translate(lower(name), ${ACCENTED_CHARS}, ${PLAIN_CHARS}) LIKE ${pattern} ESCAPE '\\'
  `;

  return rows.map((row) => row.id);
};

/**
 * Filtros do Prisma a partir dos parâmetros da tela de transações. Usado pela
 * tabela (getTransactions) e pela exportação em Excel, para exportar exatamente
 * o que está filtrado na tela. Sempre restrito ao usuário.
 */
export const buildTransactionsWhere = async (
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
    ...(name && {
      id: { in: await findTransactionIdsByName(userId, name) },
    }),
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
