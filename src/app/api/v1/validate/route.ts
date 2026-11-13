// API publique v1 — validation d'une facture électronique.
//
//   POST /api/v1/validate
//   Auth : Authorization: Bearer <clé>   (ou en-tête x-api-key ; clé « demo » pour essayer)
//   Corps : soit les octets bruts de la facture (Content-Type application/pdf,
//           application/xml ou text/xml), soit multipart/form-data champ « fichier ».
//   Réponse : JSON { verdict, conforme, exhaustif, score, format, profil, resume,
//             aCorriger[], … } (voir src/lib/api-schema.ts).
import { analyserFichierComplet } from "@/lib/engine";
import { versReponsePublique } from "@/lib/api-schema";
import { authentifierApi } from "@/lib/api-auth";
import { rateLimit, reponse429 } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TAILLE_MAX = 15 * 1024 * 1024;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, x-api-key, content-type",
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS, ...extra },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  // 1) Authentification
  const auth = authentifierApi(req);
  if (!auth.ok) return json({ erreur: auth.raison ?? "Non autorisé." }, 401);

  // 2) Limite de débit par clé (démo bridée)
  const quota = auth.plan === "demo" ? 5 : 120;
  const limite = rateLimit(`api:${auth.cle}`, quota, 60_000);
  if (!limite.ok) return reponse429(limite);

  // 3) Récupération du fichier (multipart OU corps brut)
  let bytes: Buffer;
  let nom = "facture";
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const f = form.get("fichier");
      if (!(f instanceof File)) return json({ erreur: "Champ « fichier » manquant (multipart/form-data)." }, 400);
      if (f.size > TAILLE_MAX) return json({ erreur: "Fichier trop volumineux (15 Mo maximum)." }, 413);
      bytes = Buffer.from(await f.arrayBuffer());
      nom = f.name || nom;
    } else {
      const ab = await req.arrayBuffer();
      bytes = Buffer.from(ab);
      if (bytes.length === 0) return json({ erreur: "Corps vide : envoyez les octets de la facture ou un multipart « fichier »." }, 400);
      if (bytes.length > TAILLE_MAX) return json({ erreur: "Fichier trop volumineux (15 Mo maximum)." }, 413);
      const url = new URL(req.url);
      nom = url.searchParams.get("nom") || (bytes.subarray(0, 5).toString("latin1").startsWith("%PDF") ? "facture.pdf" : "facture.xml");
    }
  } catch (e) {
    return json({ erreur: `Requête illisible : ${(e as Error).message}` }, 400);
  }

  // 4) Analyse
  try {
    const { report } = await analyserFichierComplet({ nom, bytes });
    return json(versReponsePublique(report, nom), 200, {
      "x-ratelimit-limit": String(limite.limite),
      "x-ratelimit-remaining": String(limite.restant),
    });
  } catch (e) {
    return json({ erreur: `Échec de l'analyse : ${(e as Error).message}` }, 500);
  }
}
