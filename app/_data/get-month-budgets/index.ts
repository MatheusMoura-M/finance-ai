import { getBudgetsForMonth } from "@/app/_lib/budgets/queries";
import { auth } from "@clerk/nextjs/server";

/** Orçamentos por categoria que valem no mês, para o usuário logado. */
export const getMonthBudgets = async (month: number, year: number) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return getBudgetsForMonth(userId, month, year);
};
