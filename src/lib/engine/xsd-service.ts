// Client du service de validation XSD (structure/syntaxe des factures).
//
// La validation contre les schémas XSD officiels (CII Factur-X EN 16931, UBL 2.1)
// est déléguée à un microservice xmllint (voir services/xsd/) : schémas multi-
// fichiers volumineux, licences tierces, hors de l'app serverless. Dégradation
// gracieuse : sans service configuré/joignable, execute=false et le moteur
// retombe sur le contrôle de structure best-effort (exhaustif:false).
//
// Configuration : variable d'environnement XSD_SERVICE_URL (ex. http://xsd:8084)
import type { FormatFacture, XsdResultat } from "./types";

const TIMEOUT_MS = 20000;
const FORMATS: FormatFacture[] = ["CII", "UBL", "FACTURX_PDF"];

function indisponible(format: string, note: string): XsdResultat {
  return { execute: false, moteur: "xmllint", format, valide: null, erreurs: [], note };
}

/**
 * Valide un XML de facture contre le schéma XSD officiel de son format.
 * Ne lève jamais : execute=false en cas d'absence/erreur de service.
 */
export async function validerXsd(xml: string | null, format: FormatFacture): Promise<XsdResultat> {
  if (!FORMATS.includes(format)) return indisponible(format, `Format ${format} sans schéma XSD applicable.`);
  if (!xml) return indisponible(format, "Aucun XML à valider.");
  const base = process.env.XSD_SERVICE_URL?.replace(/\/+$/, "");
  if (!base) return indisponible(format, "Service XSD non configuré (XSD_SERVICE_URL absent).");

  let reponse: Response;
  try {
    reponse = await fetch(`${base}/validate?format=${encodeURIComponent(format)}`, {
      method: "POST",
      headers: { "content-type": "application/xml" },
      body: xml,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    return indisponible(format, `Service XSD injoignable : ${(e as Error).message}`);
  }
  if (!reponse.ok) return indisponible(format, `Service XSD : HTTP ${reponse.status}.`);

  let j: { format?: string; valid?: boolean; errors?: Array<{ line?: number; message?: string }> };
  try {
    j = (await reponse.json()) as typeof j;
  } catch (e) {
    return indisponible(format, `Réponse XSD illisible : ${(e as Error).message}`);
  }

  return {
    execute: true,
    moteur: "xmllint",
    format: j.format ?? format,
    valide: Boolean(j.valid),
    erreurs: (j.errors ?? []).slice(0, 10).map((e) => ({ ligne: Number(e.line ?? 0), message: String(e.message ?? "") })),
    note: null,
  };
}
