import { db } from "@/app/_lib/prisma";
import { BudgetRow, ResolvedBudgets, resolveMonthBudgets } from "./resolve";

/** Registros de orçamento do usuário que podem afetar o mês (até ele). */
export const getBudgetRowsUntil = async (
  userId: string,
  month: number,
  year: number,
): Promise<BudgetRow[]> => {
  const rows = await db.budget.findMany({
    where: {
      userId,
      OR: [{ year: { lt: year } }, { year, month: { lte: month } }],
    },
    select: {
      category: true,
      amount: true,
      month: true,
      year: true,
      onlyThisMonth: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    amount: row.amount === null ? null : Number(row.amount),
  }));
};

export const getBudgetsForMonth = async (
  userId: string,
  month: number,
  year: number,
): Promise<ResolvedBudgets> =>
  resolveMonthBudgets(
    await getBudgetRowsUntil(userId, month, year),
    month,
    year,
  );
