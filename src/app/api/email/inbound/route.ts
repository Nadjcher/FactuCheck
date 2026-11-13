// Webhook email ENTRANT — « transférer une facture pour la vérifier ».
//
// Un service de réception d'email (SendGrid Inbound Parse, Mailgun Routes…) POSTe
// ici le message reçu en multipart/form-data. On extrait les pièces jointes
// PDF/XML, on les analyse, et on renvoie un résumé structuré par facture.
//
//   POST /api/email/inbound?token=<EMAIL_INBOUND_SECRET>
//
// L'auto-réponse par email n'est pas incluse (elle dépend d'un fournisseur
// d'envoi) : branchez le résumé renvoyé sur votre automatisation (Zapier/Make)
// ou un service d'envoi pour répondre à l'expéditeur.
import { analyserFichierComplet } from "@/lib/engine";
import { versReponsePublique } from "@/lib/api-schema";
import { rateLimit, cleClient, reponse429 } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TAILLE_MAX = 15 * 1024 * 1024;
const EXT = /\.(pdf|xml)$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export async function POST(req: Request) {
  // Sécurité : jeton partagé dans l'URL (le webhook est public).
  const secret = process.env.EMAIL_INBOUND_SECRET;
  const token = new URL(req.url).searchParams.get("token");
  if (!secret || token !== secret) return json({ erreur: "Jeton invalide." }, 401);

  const limite = rateLimit(`email:${cleClient(req)}`, 30, 60_000);
  if (!limite.ok) return reponse429(limite);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ erreur: "Corps invalide (multipart/form-data attendu)." }, 400);
  }

  const from = String(form.get("from") ?? form.get("sender") ?? "");
  const subject = String(form.get("subject") ?? "");

  // Pièces jointes : SendGrid (attachment1, attachment2…) ou champs fichiers génériques.
  const fichiers = form
    .getAll("attachment1")
    .concat(form.getAll("attachment2"), form.getAll("attachment3"), form.getAll("attachment4"), form.getAll("attachment5"))
    .filter((v): v is File => v instanceof File);
  // Repli : tout champ de type File dont le nom ressemble à une facture.
  if (fichiers.length === 0) {
    for (const [, v] of form.entries()) {
      if (v instanceof File && EXT.test(v.name)) fichiers.push(v);
    }
  }

  const candidats = fichiers.filter((f) => EXT.test(f.name)).slice(0, 20);
  if (candidats.length === 0) {
    return json({ from, subject, factures: [], note: "Aucune pièce jointe PDF ou XML trouvée." });
  }

  const factures = [];
  for (const f of candidats) {
    if (f.size > TAILLE_MAX) {
      factures.push({ fichier: f.name, erreur: "Fichier trop volumineux (15 Mo maximum)." });
      continue;
    }
    try {
      const bytes = Buffer.from(await f.arrayBuffer());
      const { report } = await analyserFichierComplet({ nom: f.name, bytes });
      factures.push(versReponsePublique(report, f.name));
    } catch (e) {
      factures.push({ fichier: f.name, erreur: `Échec de l'analyse : ${(e as Error).message}` });
    }
  }

  return json({ from, subject, factures });
}
