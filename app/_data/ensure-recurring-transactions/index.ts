import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { generateDueRecurringTransactions } from "@/app/_lib/recurring/generate";

/**
 * Chamado ao abrir o dashboard e a página de transações: cria as transações
 * recorrentes que faltam até o mês atual. Só para Premium (sem o plano, as
 * recorrências ficam pausadas). Nunca impede a página de carregar.
 */
export const ensureRecurringTransactions = async () => {
  try {
    const { userId, hasPremiumPlan } = await getUserSubscription();

    if (!hasPremiumPlan) return;

    await generateDueRecurringTransactions(userId);
  } catch (error) {
    console.error("[recurring] falha ao gerar transações recorrentes:", error);
  }
};
