"use server";

import { ActionError, runAction } from "@/app/_lib/action-result";
import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  DeleteRecurringTransactionSchema,
  UpdateRecurringTransactionSchema,
  deleteRecurringTransactionSchema,
  updateRecurringTransactionSchema,
} from "./schema";

const requireUserId = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new ActionError("Você precisa estar logado.");
  }

  return userId;
};

/**
 * Edita a recorrência. Vale para os meses ainda não gerados; as transações
 * que já existem não mudam (para mudar uma delas, edite a transação).
 */
export const updateRecurringTransaction = async (
  params: UpdateRecurringTransactionSchema,
) =>
  runAction(async () => {
    const { id, ...data } = updateRecurringTransactionSchema.parse(params);
    const userId = await requireUserId();

    const { count } = await db.recurringTransaction.updateMany({
      where: { id, userId },
      data,
    });

    if (count === 0) {
      throw new ActionError("Recorrência não encontrada.");
    }

    revalidatePath("/transactions");
  });

/**
 * Para de repetir: apaga a recorrência. As transações já criadas continuam
 * (só perdem o vínculo com a recorrência).
 */
export const deleteRecurringTransaction = async (
  params: DeleteRecurringTransactionSchema,
) =>
  runAction(async () => {
    const { id } = deleteRecurringTransactionSchema.parse(params);
    const userId = await requireUserId();

    const { count } = await db.recurringTransaction.deleteMany({
      where: { id, userId },
    });

    if (count === 0) {
      throw new ActionError("Recorrência não encontrada.");
    }

    revalidatePath("/transactions");
    revalidatePath("/");
  });
