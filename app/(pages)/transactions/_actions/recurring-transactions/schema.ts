import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";

export const updateRecurringTransactionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  amount: z.number().positive(),
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  paymentMethod: z.nativeEnum(TransactionPaymentMethod),
  dayOfMonth: z.number().int().min(1).max(31),
});

export type UpdateRecurringTransactionSchema = z.infer<
  typeof updateRecurringTransactionSchema
>;

export const deleteRecurringTransactionSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteRecurringTransactionSchema = z.infer<
  typeof deleteRecurringTransactionSchema
>;
