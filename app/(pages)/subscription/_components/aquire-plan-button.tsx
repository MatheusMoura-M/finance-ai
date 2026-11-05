"use client";

import { Button } from "@/app/_components/ui/button";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createStripeCheckout } from "../_actions/create-stripe-checkout";
import { createStripePortalSession } from "../_actions/create-stripe-portal-session";

interface AquirePlanButtonProps {
  hasPremiumPlan: boolean;
}

const AquirePlanButton = ({ hasPremiumPlan }: AquirePlanButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = async (getUrl: () => Promise<{ url: string }>) => {
    try {
      setIsLoading(true);

      const { url } = await getUrl();

      window.location.href = url;
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível abrir o Stripe. Tente novamente.");
      setIsLoading(false);
    }
  };

  if (hasPremiumPlan) {
    return (
      <Button
        className="w-full rounded-full"
        variant="link"
        disabled={isLoading}
        onClick={() => redirectTo(createStripePortalSession)}
      >
        {isLoading && <Loader2Icon className="animate-spin" />}
        Gerenciar Plano
      </Button>
    );
  }

  return (
    <Button
      className="w-full rounded-full"
      disabled={isLoading}
      onClick={() => redirectTo(createStripeCheckout)}
    >
      {isLoading && <Loader2Icon className="animate-spin" />}
      Adquirir Plano
    </Button>
  );
};

export default AquirePlanButton;
