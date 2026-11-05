"use server";

import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { ActionError, runAction } from "@/app/_lib/action-result";
import { getAppUrl } from "@/app/_lib/app-url";
import { getServerEnv } from "@/app/_lib/env";
import { getStripe } from "@/app/_lib/stripe";

export const createStripeCheckout = async () =>
  runAction(async () => {
    const { userId, hasPremiumPlan } = await getUserSubscription();

    // Evita criar uma segunda assinatura para quem já é Premium.
    if (hasPremiumPlan) {
      throw new ActionError("Você já possui o Plano Premium.");
    }

    const appUrl = getAppUrl();

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      success_url: `${appUrl}/subscription?checkout=success`,
      cancel_url: `${appUrl}/subscription`,
      client_reference_id: userId,
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
        },
      },
      line_items: [
        {
          price: getServerEnv().STRIPE_PREMIUM_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
    });

    if (!session.url) {
      throw new Error("Stripe checkout session without url");
    }

    return { url: session.url };
  });
