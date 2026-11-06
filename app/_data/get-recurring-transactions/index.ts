import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";

export interface RecurringTransactionItem {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  dayOfMonth: number;
}

/** Recorrências do usuário logado, para a lista "Recorrências". */
export const getRecurringTransactions = async (): Promise<
  RecurringTransactionItem[]
> => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const recurrences = await db.recurringTransaction.findMany({
    where: { userId },
    orderBy: [{ dayOfMonth: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      amount: true,
      category: true,
      paymentMethod: true,
      dayOfMonth: true,
    },
  });

  return recurrences.map((recurrence) => ({
    ...recurrence,
    amount: Number(recurrence.amount),
  }));
};
