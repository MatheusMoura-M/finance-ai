"use server";

import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { ActionError, runAction } from "@/app/_lib/action-result";
import { buildHistoryIndex } from "@/app/_lib/categorize/suggest";
import { db } from "@/app/_lib/prisma";

/** Quantas transações recentes usar para montar o histórico. */
const HISTORY_SIZE = 2_000;

/**
 * Resumo do histórico do usuário para sugerir categoria e forma de pagamento
 * no formulário: para cada nome, a escolha mais recente. Carregado uma vez ao
 * abrir o formulário; a sugestão em si roda no navegador. Só Premium.
 */
export const getSuggestionHistory = async () =>
  runAction(async () => {
    const { userId, hasPremiumPlan } = await getUserSubscription();

    if (!hasPremiumPlan) {
      throw new ActionError(
        "Categoria sugerida é um recurso do Plano Premium.",
      );
    }

    const transactions = await db.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: HISTORY_SIZE,
      select: { name: true, category: true, paymentMethod: true },
    });

    return Array.from(buildHistoryIndex(transactions).entries());
  });
