import {
  TransactionType,
  TransactionCategory,
  TransactionPaymentMethod,
} from "@prisma/client";
import { z } from "zod";
import { MAX_INSTALLMENTS } from "@/app/_lib/installments/split";

export const addTransactionSchema = z.object({
  name: z.string().trim().min(1),
  amount: z.number().positive(),
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  paymentMethod: z.nativeEnum(TransactionPaymentMethod),
  date: z.date(),
});

export const transactionIdSchema = z.string().uuid().optional();

/** 1 = à vista; de 2 até MAX_INSTALLMENTS = parcelado. */
export const installmentsSchema = z.number().int().min(1).max(MAX_INSTALLMENTS);
