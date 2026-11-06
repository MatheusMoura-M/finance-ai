import { db } from "@/app/_lib/prisma";
import { startOfMonth } from "date-fns";
import { getDueOccurrences } from "./occurrences";

/**
 * Cria as transações das recorrências do usuário que ainda faltam, até o mês
 * atual. Idempotente: pode rodar a cada página aberta (a unicidade
 * recorrência + data impede duplicatas mesmo com duas abas ao mesmo tempo).
 * Devolve quantas transações foram criadas.
 */
export const generateDueRecurringTransactions = async (
  userId: string,
  now: Date = new Date(),
): Promise<number> => {
  const recurrences = await db.recurringTransaction.findMany({
    where: {
      userId,
      OR: [
        { lastGeneratedAt: null },
        { lastGeneratedAt: { lt: startOfMonth(now) } },
      ],
    },
  });

  let created = 0;

  for (const recurrence of recurrences) {
    const dates = getDueOccurrences(recurrence, now);

    if (!dates.length) continue;

    const [result] = await db.$transaction([
      db.transaction.createMany({
        data: dates.map((date) => ({
          userId,
          name: recurrence.name,
          type: recurrence.type,
          amount: recurrence.amount,
          category: recurrence.category,
          paymentMethod: recurrence.paymentMethod,
          date,
          recurringTransactionId: recurrence.id,
        })),
        skipDuplicates: true,
      }),
      db.recurringTransaction.update({
        where: { id: recurrence.id },
        data: { lastGeneratedAt: dates[dates.length - 1] },
      }),
    ]);

    created += result.count;
  }

  return created;
};
