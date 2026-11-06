import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { endOfMonth, startOfMonth } from "date-fns";

/**
 * Transações criadas pelo usuário neste mês, para o limite do plano grátis.
 * Uma compra parcelada conta como 1: só a 1ª parcela entra na contagem.
 */
export const getCurrentMonthTransactions = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await db.transaction.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth(new Date()),
        lt: endOfMonth(new Date()),
      },
      OR: [{ installmentNumber: null }, { installmentNumber: 1 }],
    },
  });
};
