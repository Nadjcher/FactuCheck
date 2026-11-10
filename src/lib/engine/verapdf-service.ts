// Client du service de validation PDF/A-3 (veraPDF).
//
// L'app (Next.js serverless, JS pur) ne peut pas exécuter veraPDF (Java) par
// requête : la validation PDF/A-3 COMPLÈTE (ISO 19005-3 : profil ICC, output
// intent, polices, XMP…) est déléguée à un microservice veraPDF (voir
// services/verapdf/). Ce module l'appelle en HTTP, avec dégradation gracieuse :
// si le service n'est pas configuré ou injoignable, execute=false et le moteur
// retombe sur le contrôle de marqueurs (exhaustif:false → « Contrôle partiel »).
//
// Configuration : variable d'environnement VERAPDF_SERVICE_URL
//   ex. VERAPDF_SERVICE_URL=http://verapdf:8083
import type { PdfA3Resultat } from "./types";

const FLAVOUR = "3b"; // Factur-X : PDF/A-3 niveau B
const TIMEOUT_MS = 20000;

function indisponible(note: string): PdfA3Resultat {
  return { execute: false, moteur: "veraPDF", flavour: FLAVOUR, conforme: null, passed: 0, failed: 0, details: [], note };
}

/**
 * Valide un PDF en PDF/A-3 via le service veraPDF.
 * Ne lève jamais : renvoie execute=false en cas d'absence/erreur de service.
 */
export async function validerPdfA3(bytes: Buffer | Uint8Array): Promise<PdfA3Resultat> {
  const base = process.env.VERAPDF_SERVICE_URL?.replace(/\/+$/, "");
  if (!base) return indisponible("Service veraPDF non configuré (VERAPDF_SERVICE_URL absent).");

  let reponse: Response;
  try {
    reponse = await fetch(`${base}/validate?flavour=${FLAVOUR}`, {
      method: "POST",
      headers: { "content-type": "application/pdf" },
      body: bytes as BodyInit,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    return indisponible(`Service veraPDF injoignable : ${(e as Error).message}`);
  }
  if (!reponse.ok) return indisponible(`Service veraPDF : HTTP ${reponse.status}.`);

  let j: {
    compliant?: boolean;
    flavour?: string;
    passedChecks?: number;
    failedChecks?: number;
    failures?: Array<{ clause?: string; message?: string }>;
  };
  try {
    j = (await reponse.json()) as typeof j;
  } catch (e) {
    return indisponible(`Réponse veraPDF illisible : ${(e as Error).message}`);
  }

  return {
    execute: true,
    moteur: "veraPDF",
    flavour: j.flavour ?? FLAVOUR,
    conforme: Boolean(j.compliant),
    passed: Number(j.passedChecks ?? 0),
    failed: Number(j.failedChecks ?? 0),
    details: (j.failures ?? [])
      .slice(0, 5)
      .map((f) => ({ clause: String(f.clause ?? ""), message: String(f.message ?? "") })),
    note: null,
  };
}
