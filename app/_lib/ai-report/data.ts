import { db } from "@/app/_lib/prisma";
import { getMonthDateRange } from "@/app/_utils/date";
import { TransactionCategory, TransactionType } from "@prisma/client";

export interface PeriodTotals {
  deposits: number;
  expenses: number;
  investments: number;
  balance: number;
  transactionCount: number;
}

export interface CategoryComparison {
  category: TransactionCategory;
  total: number;
  previousTotal: number;
}

export interface TopExpense {
  name: string;
  amount: number;
  category: TransactionCategory;
  date: Date;
}

export interface AiReportInput {
  month: number;
  year: number;
  previousMonth: number;
  previousYear: number;
  current: PeriodTotals;
  previous: PeriodTotals;
  expensesByCategory: CategoryComparison[];
  topExpenses: TopExpense[];
}

const TOP_EXPENSES_LIMIT = 10;

type TypeTotalsRow = {
  type: TransactionType;
  _sum: { amount: unknown };
  _count: { _all: number };
};

const toPeriodTotals = (rows: TypeTotalsRow[]): PeriodTotals => {
  const total = (type: TransactionType) =>
    Number(rows.find((row) => row.type === type)?._sum.amount ?? 0);

  const deposits = total(TransactionType.DEPOSIT);
  const expenses = total(TransactionType.EXPENSE);
  const investments = total(TransactionType.INVESTMENT);

  return {
    deposits,
    expenses,
    investments,
    balance: Math.round((deposits - expenses - investments) * 100) / 100,
    transactionCount: rows.reduce((sum, row) => sum + row._count._all, 0),
  };
};

/**
 * Dados agregados que vão para o prompt do relatório: totais do mês e do mês
 * anterior, despesas por categoria comparadas e as maiores despesas do mês.
 * Sempre filtrado pelo usuário.
 */
export const getAiReportInput = async (
  userId: string,
  month: number,
  year: number,
): Promise<AiReportInput> => {
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;

  const currentWhere = { userId, date: getMonthDateRange(month, year) };
  const previousWhere = {
    userId,
    date: getMonthDateRange(previousMonth, previousYear),
  };

  const [
    currentTypeRows,
    previousTypeRows,
    currentCategoryRows,
    previousCategoryRows,
    topExpenses,
  ] = await Promise.all([
    db.transaction.groupBy({
      by: ["type"],
      where: currentWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.transaction.groupBy({
      by: ["type"],
      where: previousWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.transaction.groupBy({
      by: ["category"],
      where: { ...currentWhere, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["category"],
      where: { ...previousWhere, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where: { ...currentWhere, type: TransactionType.EXPENSE },
      orderBy: { amount: "desc" },
      take: TOP_EXPENSES_LIMIT,
      select: { name: true, amount: true, category: true, date: true },
    }),
  ]);

  const previousByCategory = new Map(
    previousCategoryRows.map((row) => [
      row.category,
      Number(row._sum.amount ?? 0),
    ]),
  );

  const categories = new Set([
    ...currentCategoryRows.map((row) => row.category),
    ...previousCategoryRows.map((row) => row.category),
  ]);

  const expensesByCategory = Array.from(categories)
    .map((category) => ({
      category,
      total: Number(
        currentCategoryRows.find((row) => row.category === category)?._sum
          .amount ?? 0,
      ),
      previousTotal: previousByCategory.get(category) ?? 0,
    }))
    .sort((a, b) => b.total - a.total || b.previousTotal - a.previousTotal);

  return {
    month,
    year,
    previousMonth,
    previousYear,
    current: toPeriodTotals(currentTypeRows as TypeTotalsRow[]),
    previous: toPeriodTotals(previousTypeRows as TypeTotalsRow[]),
    expensesByCategory,
    topExpenses: topExpenses.map((expense) => ({
      ...expense,
      amount: Number(expense.amount),
    })),
  };
};
