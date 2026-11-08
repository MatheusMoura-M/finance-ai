import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";

export const updateRecurringTransactionSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  amount: z.number().positive(),
  type: z.enum(TransactionType),
  category: z.enum(TransactionCategory),
  paymentMethod: z.enum(TransactionPaymentMethod),
  dayOfMonth: z.number().int().min(1).max(31),
});

export type UpdateRecurringTransactionSchema = z.infer<
  typeof updateRecurringTransactionSchema
>;

export const deleteRecurringTransactionSchema = z.object({
  id: z.uuid(),
});

export type DeleteRecurringTransactionSchema = z.infer<
  typeof deleteRecurringTransactionSchema
>;
