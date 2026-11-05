"use server";

import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { ActionError, runAction } from "@/app/_lib/action-result";
import { getAppUrl } from "@/app/_lib/app-url";
import { getStripe } from "@/app/_lib/stripe";

/**
 * Abre o portal do cliente do Stripe já autenticado no customer do usuário,
 * sem precisar de link fixo nem de e-mail na URL.
 */
export const createStripePortalSession = async () =>
  runAction(async () => {
    const { stripeCustomerId } = await getUserSubscription();

    if (!stripeCustomerId) {
      throw new ActionError("Nenhuma assinatura encontrada para gerenciar.");
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getAppUrl()}/subscription`,
    });

    return { url: session.url };
  });
