import { db } from "@/app/_lib/prisma";
import { getMonthDateRange } from "@/app/_utils/date";
import { TransactionCategory, TransactionType } from "@prisma/client";
import { getBudgetsForMonth } from "./queries";

export interface BudgetAlert {
  category: TransactionCategory;
  spent: number;
  budget: number;
  month: number;
  year: number;
}

/**
 * Depois de salvar uma despesa: se a categoria passou do orçamento daquele
 * mês, devolve os números para avisar o usuário. Nunca impede o salvamento —
 * se algo falhar aqui, só não mostra o aviso.
 */
export const getBudgetAlert = async (
  userId: string,
  transaction: {
    type: TransactionType;
    category: TransactionCategory;
    date: Date;
  },
): Promise<BudgetAlert | null> => {
  if (transaction.type !== TransactionType.EXPENSE) return null;

  try {
    const month = transaction.date.getMonth() + 1;
    const year = transaction.date.getFullYear();

    const { effective } = await getBudgetsForMonth(userId, month, year);
    const budget = effective[transaction.category];

    if (!budget) return null;

    const { _sum } = await db.transaction.aggregate({
      where: {
        userId,
        category: transaction.category,
        type: TransactionType.EXPENSE,
        date: getMonthDateRange(month, year),
      },
      _sum: { amount: true },
    });

    const spent = Number(_sum.amount ?? 0);

    return spent > budget
      ? { category: transaction.category, spent, budget, month, year }
      : null;
  } catch (error) {
    console.error("[budget-alert] falha ao verificar orçamento:", error);
    return null;
  }
};
