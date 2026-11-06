"use server";

import {
  FREE_PLAN_MONTHLY_TRANSACTIONS_LIMIT,
  canUserAddTransaction,
} from "@/app/_data/can-user-add-transaction";
import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { ActionError, runAction } from "@/app/_lib/action-result";
import { getBudgetAlert } from "@/app/_lib/budgets/alert";
import { db } from "@/app/_lib/prisma";
import { generateDueRecurringTransactions } from "@/app/_lib/recurring/generate";
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
  /** Só na criação: cria também uma recorrência mensal (Premium). */
  repeatMonthly?: boolean;
}

export const upsertTransaction = async ({
  id,
  repeatMonthly = false,
  ...params
}: upsertTransactionProps) =>
  runAction(async () => {
    const transactionId = transactionIdSchema.parse(id);
    const data = addTransactionSchema.parse(params);

    const { userId } = await auth();

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

      if (repeatMonthly) {
        const { hasPremiumPlan } = await getUserSubscription();

        if (!hasPremiumPlan) {
          throw new ActionError(
            "Repetir todo mês é um recurso do Plano Premium.",
          );
        }

        // Cria a recorrência já com a transação deste mês ligada a ela.
        await db.recurringTransaction.create({
          data: {
            userId,
            name: data.name,
            type: data.type,
            amount: data.amount,
            category: data.category,
            paymentMethod: data.paymentMethod,
            dayOfMonth: data.date.getDate(),
            startDate: data.date,
            lastGeneratedAt: data.date,
            transactions: { create: { ...data, userId } },
          },
        });

        // Se a data informada for de um mês passado, preenche até o mês atual.
        await generateDueRecurringTransactions(userId);
      } else {
        await db.transaction.create({
          data: { ...data, userId },
        });
      }
    }

    revalidatePath("/transactions");
    revalidatePath("/");

    // Se a despesa fez a categoria passar do orçamento do mês, avisa na tela.
    return { budgetAlert: await getBudgetAlert(userId, data) };
  });
