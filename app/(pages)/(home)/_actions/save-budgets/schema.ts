import { TransactionCategory } from "@prisma/client";
import { z } from "zod";

export const saveBudgetsSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1900).max(2100),
  /** "fromThisMonth": vale deste mês em diante. "onlyThisMonth": só neste mês. */
  scope: z.enum(["fromThisMonth", "onlyThisMonth"]),
  budgets: z
    .array(
      z.object({
        category: z.nativeEnum(TransactionCategory),
        /** null = sem orçamento. */
        amount: z.number().positive().max(99_999_999).nullable(),
      }),
    )
    .max(Object.keys(TransactionCategory).length),
});

export type SaveBudgetsSchema = z.infer<typeof saveBudgetsSchema>;
