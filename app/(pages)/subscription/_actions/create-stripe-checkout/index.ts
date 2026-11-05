"use server";

import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { getStripe } from "@/app/_lib/stripe";
import { getAppUrl } from "@/app/_lib/app-url";

export const createStripeCheckout = async () => {
  const { userId, hasPremiumPlan } = await getUserSubscription();

  // Evita criar uma segunda assinatura para quem já é Premium.
  if (hasPremiumPlan) {
    throw new Error("User already has a premium plan");
  }

  const priceId = process.env.STRIPE_PREMIUM_PLAN_PRICE_ID;

  if (!priceId) {
    throw new Error("Stripe premium plan price id not found");
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
        price: priceId,
        quantity: 1,
      },
    ],
  });

  if (!session.url) {
    throw new Error("Stripe checkout session without url");
  }

  return { url: session.url };
};
