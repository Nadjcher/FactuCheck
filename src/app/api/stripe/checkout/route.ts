import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { erreur: "Paiement non configuré (mode démonstration)." },
      { status: 503 },
    );
  }

  const { plan } = (await req.json().catch(() => ({}))) as { plan?: string };
  const def = PLANS.find((p) => p.id === plan);
  if (!def || !def.envPriceId) {
    return NextResponse.json({ erreur: "Offre inconnue." }, { status: 400 });
  }
  const priceId = process.env[def.envPriceId];
  if (!priceId) {
    return NextResponse.json(
      { erreur: `Prix Stripe non configuré (${def.envPriceId}).` },
      { status: 503 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/parametres?paiement=succes`,
    cancel_url: `${appUrl}/tarifs?paiement=annule`,
    locale: "fr",
  });

  return NextResponse.json({ url: session.url });
}
