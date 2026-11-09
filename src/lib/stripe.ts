import Stripe from "stripe";

export const stripeConfigure = Boolean(process.env.STRIPE_SECRET_KEY);

/** Instance Stripe serveur, ou null si non configuré (mode démo). */
export function getStripe(): Stripe | null {
  if (!stripeConfigure) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia",
  });
}
