import { CII_VALIDE } from "@/lib/engine/__fixtures__/invoices";

export const runtime = "nodejs";

// Fournit une facture d'exemple (Factur-X CII valide) à essayer.
export async function GET() {
  return new Response(CII_VALIDE, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": 'attachment; filename="facture-exemple-factur-x.xml"',
    },
  });
}
