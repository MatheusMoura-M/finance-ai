import { db } from "@/app/_lib/prisma";
import { getMonthDateRange } from "@/app/_utils/date";
import { auth } from "@clerk/nextjs/server";
import { TransactionType } from "@prisma/client";
import { TotalExpensePerCategory, TransactionPercentagePerType } from "./types";

const calculatePercentage = (part: number, total: number): number => {
  return total > 0 ? Math.round((part / total) * 100) : 0;
};

export const getDashboard = async (month: string, year: number) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const where = {
    userId,
    date: getMonthDateRange(month, year),
  };

  // 3 consultas em paralelo (antes eram 6 em sequência).
  const [totalsPerType, totalsPerCategory, lastTransactions] =
    await Promise.all([
      db.transaction.groupBy({
        by: ["type"],
        where,
        _sum: { amount: true },
      }),
      db.transaction.groupBy({
        by: ["category"],
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        take: 10,
      }),
    ]);

  const getTypeTotal = (type: TransactionType) =>
    Number(
      totalsPerType.find((total) => total.type === type)?._sum.amount ?? 0,
    );

  const depositsTotal = getTypeTotal(TransactionType.DEPOSIT);
  const investmentsTotal = getTypeTotal(TransactionType.INVESTMENT);
  const expensesTotal = getTypeTotal(TransactionType.EXPENSE);
  const transactionsTotal = depositsTotal + investmentsTotal + expensesTotal;

  const balance = depositsTotal - investmentsTotal - expensesTotal;

  const typesPercentage: TransactionPercentagePerType = {
    [TransactionType.DEPOSIT]: calculatePercentage(
      depositsTotal,
      transactionsTotal,
    ),
    [TransactionType.EXPENSE]: calculatePercentage(
      expensesTotal,
      transactionsTotal,
    ),
    [TransactionType.INVESTMENT]: calculatePercentage(
      investmentsTotal,
      transactionsTotal,
    ),
  };

  const totalExpensePerCategory: TotalExpensePerCategory[] = totalsPerCategory
    .map((category) => {
      const totalAmount = Number(category._sum.amount ?? 0);

      return {
        category: category.category,
        totalAmount,
        percentageOfTotal: calculatePercentage(totalAmount, expensesTotal),
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    balance,
    depositsTotal,
    expensesTotal,
    investmentsTotal,
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions: JSON.parse(JSON.stringify(lastTransactions)),
  };
};
