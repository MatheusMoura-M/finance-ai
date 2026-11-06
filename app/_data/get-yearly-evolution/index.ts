import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { TransactionType } from "@prisma/client";
import { endOfYear, startOfYear } from "date-fns";

export interface MonthlyEvolution {
  /** Mês de 1 a 12. */
  month: number;
  deposits: number;
  expenses: number;
  investments: number;
  balance: number;
}

const TOTAL_KEY_BY_TYPE: Record<
  TransactionType,
  keyof Omit<MonthlyEvolution, "month" | "balance">
> = {
  [TransactionType.DEPOSIT]: "deposits",
  [TransactionType.EXPENSE]: "expenses",
  [TransactionType.INVESTMENT]: "investments",
};

/**
 * Totais de receita, despesa e investimento de cada mês do ano (sempre 12
 * meses, com zero nos meses sem transações). Os meses são calculados do mesmo
 * jeito que o dashboard (getMonthDateRange), para os números baterem.
 */
export const getYearlyEvolution = async (
  year: number,
): Promise<MonthlyEvolution[]> => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const reference = new Date(year, 0, 1);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: { gte: startOfYear(reference), lte: endOfYear(reference) },
    },
    select: { date: true, type: true, amount: true },
  });

  const months: MonthlyEvolution[] = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    deposits: 0,
    expenses: 0,
    investments: 0,
    balance: 0,
  }));

  for (const transaction of transactions) {
    const month = months[new Date(transaction.date).getMonth()];

    month[TOTAL_KEY_BY_TYPE[transaction.type]] += Number(transaction.amount);
  }

  for (const month of months) {
    // Arredonda para centavos (soma de floats pode gerar 0.30000000000000004).
    month.deposits = Math.round(month.deposits * 100) / 100;
    month.expenses = Math.round(month.expenses * 100) / 100;
    month.investments = Math.round(month.investments * 100) / 100;
    month.balance =
      Math.round((month.deposits - month.expenses - month.investments) * 100) /
      100;
  }

  return months;
};
