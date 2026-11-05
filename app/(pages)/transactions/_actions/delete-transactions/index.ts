"use server";

import { ActionError, runAction } from "@/app/_lib/action-result";
import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { DeleteTransactionSchema, deleteTransactionsSchema } from "./schema";

export const deleteTransaction = async (params: DeleteTransactionSchema) =>
  runAction(async () => {
    const { transactionId } = deleteTransactionsSchema.parse(params);

    const { userId } = await auth();

    if (!userId) {
      throw new ActionError("Você precisa estar logado.");
    }

    // deleteMany com userId garante que só o dono consegue apagar a transação.
    const { count } = await db.transaction.deleteMany({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (count === 0) {
      throw new ActionError("Transação não encontrada.");
    }

    revalidatePath("/transactions");
    revalidatePath("/");
  });
