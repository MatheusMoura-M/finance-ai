"use server";

import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { getStripe } from "@/app/_lib/stripe";
import { getAppUrl } from "@/app/_lib/app-url";

/**
 * Abre o portal do cliente do Stripe já autenticado no customer do usuário,
 * sem precisar de link fixo nem de e-mail na URL.
 */
export const createStripePortalSession = async () => {
  const { stripeCustomerId } = await getUserSubscription();

  if (!stripeCustomerId) {
    throw new Error("Stripe customer not found");
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${getAppUrl()}/subscription`,
  });

  return { url: session.url };
};
