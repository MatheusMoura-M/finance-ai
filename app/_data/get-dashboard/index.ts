import { db } from "@/app/_lib/prisma";
import { TransactionType } from "@prisma/client";
import { TotalExpensePerCategory, TransactionPercentagePerType } from "./types";
import { auth } from "@clerk/nextjs/server";

export const getDashboard = async (month: string, year: number) => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const formattedMonth = month.padStart(2, "0");

  const where = {
    userId,
    date: {
      gte: new Date(`${year}-${formattedMonth}-01`),
      lt: new Date(`${year}-${formattedMonth}-31`),
    },
  };

  const depositsTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: "DEPOSIT" },
        _sum: { amount: true },
      })
    )?._sum?.amount,
  );

  const investmentsTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: "INVESTMENT" },
        _sum: { amount: true },
      })
    )?._sum?.amount,
  );

  const expensesTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: "EXPENSE" },
        _sum: { amount: true },
      })
    )?._sum?.amount,
  );

  const transactionsTotal = Number(
    (
      await db.transaction.aggregate({
        where,
        _sum: { amount: true },
      })
    )._sum.amount,
  );

  const balance = depositsTotal - investmentsTotal - expensesTotal;

  const calculatePercentage = (part: number, total: number): number => {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  };

  const typesPercentage: TransactionPercentagePerType = {
    [TransactionType.DEPOSIT]: calculatePercentage(
      Number(depositsTotal || 0),
      Number(transactionsTotal),
    ),
    [TransactionType.EXPENSE]: calculatePercentage(
      Number(expensesTotal || 0),
      Number(transactionsTotal),
    ),
    [TransactionType.INVESTMENT]: calculatePercentage(
      Number(investmentsTotal || 0),
      Number(transactionsTotal),
    ),
  };

  const totalExpensePerCategory: TotalExpensePerCategory[] = (
    await db.transaction.groupBy({
      by: ["category"],
      where: {
        ...where,
        type: TransactionType.EXPENSE,
      },
      _sum: {
        amount: true,
      },
    })
  ).map((category) => ({
    category: category.category,
    totalAmount: Number(category._sum.amount),
    percentageOfTotal: Math.round(
      (Number(category._sum.amount) / Number(expensesTotal)) * 100,
    ),
  }));

  const lastTransactions = await db.transaction.findMany({
    where,
    orderBy: {
      date: "desc",
    },
    take: 10,
  });

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
