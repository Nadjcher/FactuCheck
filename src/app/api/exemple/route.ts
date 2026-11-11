import { CII_EXEMPLE_CONFORME } from "@/lib/engine/__fixtures__/invoices";

export const runtime = "nodejs";

// Fournit une facture d'exemple RÉELLEMENT conforme (EN 16931 + FNFE-MPE,
// vérifiée contre le moteur de référence Saxon) à essayer.
export async function GET() {
  return new Response(CII_EXEMPLE_CONFORME, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": 'attachment; filename="facture-exemple-factur-x.xml"',
    },
  });
}
