import { auth, clerkClient } from "@clerk/nextjs/server";
import { cache } from "react";

/**
 * Plano do usuário logado, lido do Clerk.
 *
 * Envolto em `cache` do React: várias chamadas no mesmo request (página,
 * `canUserAddTransaction`, actions) fazem uma única ida ao Clerk.
 * Só para uso no servidor — `stripeCustomerId` não deve ir para o cliente.
 */
export const getUserSubscription = cache(async () => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await clerkClient().users.getUser(userId);

  const stripeCustomerId = user.privateMetadata.stripeCustomerId;

  return {
    userId,
    hasPremiumPlan: user.publicMetadata.subscriptionPlan === "premium",
    stripeCustomerId:
      typeof stripeCustomerId === "string" ? stripeCustomerId : null,
  };
});
