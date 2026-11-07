import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";

/** Tamanho máximo do conteúdo do arquivo (~2 MB de texto). */
export const MAX_STATEMENT_CHARS = 2_000_000;
/** Máximo de lançamentos por importação. */
export const MAX_IMPORT_ROWS = 1_000;

export const previewStatementSchema = z.object({
  content: z.string().min(1).max(MAX_STATEMENT_CHARS),
});

export type PreviewStatementSchema = z.infer<typeof previewStatementSchema>;

export const confirmImportSchema = z.object({
  rows: z
    .array(
      z.object({
        importHash: z.string().regex(/^[a-f0-9]{32}$/),
        /** Data em ISO, como veio da prévia. */
        date: z.string().datetime(),
        name: z.string().trim().min(1).max(120),
        amount: z.number().positive().max(99_999_999),
        type: z.nativeEnum(TransactionType),
        category: z.nativeEnum(TransactionCategory),
        paymentMethod: z.nativeEnum(TransactionPaymentMethod),
      }),
    )
    .min(1)
    .max(MAX_IMPORT_ROWS),
});

export type ConfirmImportSchema = z.input<typeof confirmImportSchema>;
