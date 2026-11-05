"use server";

import {
  FREE_PLAN_MONTHLY_TRANSACTIONS_LIMIT,
  canUserAddTransaction,
} from "@/app/_data/can-user-add-transaction";
import { ActionError, runAction } from "@/app/_lib/action-result";
import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { addTransactionSchema, transactionIdSchema } from "./schema";

interface upsertTransactionProps {
  id?: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  date: Date;
}

export const upsertTransaction = async ({
  id,
  ...params
}: upsertTransactionProps) =>
  runAction(async () => {
    const transactionId = transactionIdSchema.parse(id);
    const data = addTransactionSchema.parse(params);

    const { userId } = auth();

    if (!userId) {
      throw new ActionError("Você precisa estar logado.");
    }

    if (transactionId) {
      // updateMany com userId garante que só o dono consegue editar a transação.
      const { count } = await db.transaction.updateMany({
        where: { id: transactionId, userId },
        data,
      });

      if (count === 0) {
        throw new ActionError("Transação não encontrada.");
      }
    } else {
      // O limite do plano grátis precisa valer no servidor, não só na interface.
      if (!(await canUserAddTransaction())) {
        throw new ActionError(
          `Você atingiu o limite de ${FREE_PLAN_MONTHLY_TRANSACTIONS_LIMIT} transações deste mês. Assine o Premium para ter transações ilimitadas.`,
        );
      }

      await db.transaction.create({
        data: { ...data, userId },
      });
    }

    revalidatePath("/transactions");
    revalidatePath("/");
  });
