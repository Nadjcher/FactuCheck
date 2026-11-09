import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Webhook Stripe : met à jour l'abonnement / le quota côté base.
// Scaffold MVP : la signature est vérifiée ; le traitement métier reste à brancher
// sur la table `subscriptions` (voir supabase/schema.sql).
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ recu: false, demo: true }, { status: 200 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", secret);
  } catch (e) {
    return NextResponse.json(
      { erreur: `Signature invalide : ${(e as Error).message}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // TODO : mettre à jour `subscriptions` (plan, quota, statut) via Supabase.
      break;
    default:
      break;
  }

  return NextResponse.json({ recu: true });
}
