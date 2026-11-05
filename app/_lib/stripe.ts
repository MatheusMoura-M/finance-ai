import Stripe from "stripe";
import { getServerEnv } from "./env";

export const STRIPE_API_VERSION = "2025-02-24.acacia";

export const getStripe = () => {
  return new Stripe(getServerEnv().STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });
};
