// Limiteur de débit simple (fenêtre fixe, en mémoire) pour les endpoints publics.
//
// NOTE production : la mémoire n'est pas partagée entre instances serverless.
// Pour un vrai plafond distribué, brancher un magasin partagé (Redis / Upstash)
// derrière la même interface `rateLimit()`. En mono-instance / auto-hébergé, ce
// limiteur suffit comme première barrière anti-abus.

interface Fenetre {
  count: number;
  reset: number; // epoch ms de fin de fenêtre
}

const buckets = new Map<string, Fenetre>();
let dernierNettoyage = 0;

function nettoyer(maintenant: number) {
  // Purge paresseuse des fenêtres expirées (évite une fuite mémoire).
  if (maintenant - dernierNettoyage < 60_000) return;
  dernierNettoyage = maintenant;
  for (const [cle, f] of buckets) if (f.reset <= maintenant) buckets.delete(cle);
}

export interface ResultatLimite {
  ok: boolean;
  limite: number;
  restant: number;
  /** Secondes avant réinitialisation (pour l'en-tête Retry-After). */
  resetDans: number;
}

/**
 * Autorise `limite` requêtes par `fenetreMs` et par clé (ex. IP).
 * Incrémente le compteur et renvoie l'état.
 */
export function rateLimit(cle: string, limite: number, fenetreMs: number): ResultatLimite {
  const maintenant = Date.now();
  nettoyer(maintenant);

  let f = buckets.get(cle);
  if (!f || f.reset <= maintenant) {
    f = { count: 0, reset: maintenant + fenetreMs };
    buckets.set(cle, f);
  }
  f.count += 1;

  const restant = Math.max(0, limite - f.count);
  const resetDans = Math.ceil((f.reset - maintenant) / 1000);
  return { ok: f.count <= limite, limite, restant, resetDans };
}

/** Extrait une clé d'identification du client (IP) depuis les en-têtes proxy. */
export function cleClient(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "inconnu";
}

/** Réponse 429 normalisée (JSON + Retry-After). */
export function reponse429(r: ResultatLimite): Response {
  return new Response(
    JSON.stringify({ erreur: "Trop de requêtes. Réessayez dans un instant." }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(r.resetDans),
        "x-ratelimit-limit": String(r.limite),
        "x-ratelimit-remaining": String(r.restant),
      },
    },
  );
}
