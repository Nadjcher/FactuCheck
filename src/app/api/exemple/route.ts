import { CII_EXEMPLE_CONFORME } from "@/lib/engine/__fixtures__/invoices";
import { rateLimit, cleClient, reponse429 } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Fournit une facture d'exemple RÉELLEMENT conforme (EN 16931 + FNFE-MPE,
// vérifiée contre le moteur de référence Saxon) à essayer.
export async function GET(req: Request) {
  const limite = rateLimit(`exemple:${cleClient(req)}`, 60, 60_000);
  if (!limite.ok) return reponse429(limite);

  return new Response(CII_EXEMPLE_CONFORME, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": 'attachment; filename="facture-exemple-factur-x.xml"',
    },
  });
}
