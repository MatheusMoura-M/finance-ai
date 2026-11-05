import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";

export const TRANSACTIONS_PAGE_SIZES = [10, 20, 30, 40, 50] as const;
export const DEFAULT_TRANSACTIONS_PAGE_SIZE = 10;

export const TRANSACTIONS_SORTABLE_FIELDS = [
  "name",
  "type",
  "category",
  "paymentMethod",
  "date",
  "amount",
] as const;

export type TransactionsSortField =
  (typeof TRANSACTIONS_SORTABLE_FIELDS)[number];

/** Lista separada por vírgula (ex.: "FOOD,HOUSING"), descartando valores fora do enum. */
const csvEnum = <T extends Record<string, string>>(values: T) =>
  z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .filter((item): item is T[keyof T] =>
          Object.values(values).includes(item),
        ),
    )
    .catch([]);

/** Data no formato yyyy-MM-dd. */
const dateParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);

/**
 * Parâmetros de busca da página de transações. Valores inválidos na URL caem
 * no padrão em vez de quebrar a página.
 */
export const transactionsSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((value) =>
      (TRANSACTIONS_PAGE_SIZES as readonly number[]).includes(value),
    )
    .catch(DEFAULT_TRANSACTIONS_PAGE_SIZE),
  name: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined)
    .catch(undefined),
  type: csvEnum(TransactionType),
  category: csvEnum(TransactionCategory),
  paymentMethod: csvEnum(TransactionPaymentMethod),
  from: dateParam,
  to: dateParam,
  sort: z.enum(TRANSACTIONS_SORTABLE_FIELDS).catch("date"),
  order: z.enum(["asc", "desc"]).catch("desc"),
});

export type TransactionsSearchParams = z.infer<
  typeof transactionsSearchParamsSchema
>;

export type TransactionsFilterField = "type" | "category" | "paymentMethod";

export const parseTransactionsSearchParams = (
  searchParams: Record<string, string | string[] | undefined>,
): TransactionsSearchParams => {
  // Se a URL repetir um parâmetro (?page=1&page=2), usa o primeiro.
  const flat = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

  return transactionsSearchParamsSchema.parse(flat);
};
