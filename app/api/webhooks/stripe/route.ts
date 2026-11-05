import { getServerEnv } from "@/app/_lib/env";
import { getStripe } from "@/app/_lib/stripe";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Status em que o usuário mantém o Premium. "past_due" dá um período de
// carência enquanto o Stripe tenta cobrar de novo.
const PREMIUM_STATUSES: Stripe.Subscription.Status[] = [
  "active",
  "trialing",
  "past_due",
];

const toId = (value: string | { id: string } | null) =>
  typeof value === "string" ? value : (value?.id ?? null);

const grantPremium = async (
  clerkUserId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
) => {
  await clerkClient().users.updateUser(clerkUserId, {
    privateMetadata: { stripeCustomerId, stripeSubscriptionId },
    publicMetadata: { subscriptionPlan: "premium" },
  });
};

const revokePremium = async (clerkUserId: string) => {
  await clerkClient().users.updateUser(clerkUserId, {
    privateMetadata: { stripeCustomerId: null, stripeSubscriptionId: null },
    publicMetadata: { subscriptionPlan: null },
  });
};

export const POST = async (request: Request) => {
  let webhookSecret: string;

  try {
    webhookSecret = getServerEnv().STRIPE_WEBHOOK_SECRET;
  } catch (error) {
    console.error("[stripe-webhook]", error);

    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe-webhook] assinatura inválida:", error);

    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object;
        const clerkUserId =
          invoice.subscription_details?.metadata?.clerk_user_id;

        if (!clerkUserId) {
          console.warn(
            `[stripe-webhook] invoice ${invoice.id} sem clerk_user_id`,
          );
          break;
        }

        await grantPremium(
          clerkUserId,
          toId(invoice.customer),
          toId(invoice.subscription),
        );

        break;
      }

      case "customer.subscription.updated": {
        // Busca o estado atual para não depender da ordem de entrega dos eventos.
        const subscription = await stripe.subscriptions.retrieve(
          event.data.object.id,
        );
        const clerkUserId = subscription.metadata.clerk_user_id;

        if (!clerkUserId) {
          console.warn(
            `[stripe-webhook] subscription ${subscription.id} sem clerk_user_id`,
          );
          break;
        }

        if (PREMIUM_STATUSES.includes(subscription.status)) {
          await grantPremium(
            clerkUserId,
            toId(subscription.customer),
            subscription.id,
          );
        } else {
          await revokePremium(clerkUserId);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const clerkUserId = event.data.object.metadata.clerk_user_id;

        if (!clerkUserId) {
          console.warn(
            `[stripe-webhook] subscription ${event.data.object.id} sem clerk_user_id`,
          );
          break;
        }

        await revokePremium(clerkUserId);

        break;
      }

      case "invoice.payment_failed": {
        // A mudança de status (past_due/unpaid) chega em
        // customer.subscription.updated; aqui só registramos a falha.
        const invoice = event.data.object;

        console.warn(
          `[stripe-webhook] pagamento falhou: invoice ${invoice.id}, customer ${toId(invoice.customer)}`,
        );

        break;
      }
    }
  } catch (error) {
    console.error(`[stripe-webhook] erro ao processar ${event.type}:`, error);

    // 500 faz o Stripe tentar entregar o evento de novo.
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
};
