"use server";

import { ActionError, runAction } from "@/app/_lib/action-result";
import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { DeleteTransactionSchema, deleteTransactionsSchema } from "./schema";

export const deleteTransaction = async (params: DeleteTransactionSchema) =>
  runAction(async () => {
    const { transactionId, scope } = deleteTransactionsSchema.parse(params);

    const { userId } = await auth();

    if (!userId) {
      throw new ActionError("Você precisa estar logado.");
    }

    let deleted: number;

    if (scope === "allInstallments") {
      // Busca o grupo pela própria transação do usuário, para nunca apagar
      // parcelas de outra pessoa.
      const transaction = await db.transaction.findFirst({
        where: { id: transactionId, userId },
        select: { installmentGroupId: true },
      });

      if (!transaction) {
        throw new ActionError("Transação não encontrada.");
      }

      if (!transaction.installmentGroupId) {
        throw new ActionError("Esta transação não é parcelada.");
      }

      ({ count: deleted } = await db.transaction.deleteMany({
        where: { userId, installmentGroupId: transaction.installmentGroupId },
      }));
    } else {
      // deleteMany com userId garante que só o dono consegue apagar a transação.
      ({ count: deleted } = await db.transaction.deleteMany({
        where: { id: transactionId, userId },
      }));
    }

    if (deleted === 0) {
      throw new ActionError("Transação não encontrada.");
    }

    revalidatePath("/transactions");
    revalidatePath("/");

    return { deleted };
  });
