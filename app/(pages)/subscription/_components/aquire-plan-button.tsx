"use client";

import { Button } from "@/app/_components/ui/button";
import {
  ActionResult,
  UNEXPECTED_ERROR_MESSAGE,
} from "@/app/_lib/action-result";
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

  const redirectTo = async (
    getUrl: () => Promise<ActionResult<{ url: string }>>,
  ) => {
    setIsLoading(true);

    try {
      const result = await getUrl();

      if (!result.success) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      window.location.href = result.data.url;
    } catch (error) {
      console.error(error);
      toast.error(UNEXPECTED_ERROR_MESSAGE);
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
