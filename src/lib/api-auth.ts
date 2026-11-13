// Authentification de l'API publique par clé.
//
// MVP : les clés valides proviennent de la variable d'environnement
// FACTUCHECK_API_KEYS (liste séparée par des virgules). Une clé spéciale « demo »
// est toujours acceptée (fortement limitée) pour permettre d'essayer l'API.
// Évolution : brancher la vérification sur Supabase (clé par compte / par plan).

export interface Auth {
  ok: boolean;
  /** Clé identifiée (sert de clé de rate-limiting). */
  cle: string;
  /** Plan associé : "demo" (bridé) ou "api" (clé configurée). */
  plan: "demo" | "api";
  raison?: string;
}

/** Extrait la clé d'API : en-tête Authorization: Bearer <clé> ou x-api-key. */
function extraireCle(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth) {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) return m[1].trim();
  }
  const x = req.headers.get("x-api-key");
  return x ? x.trim() : null;
}

/** Comparaison à temps constant (évite de distinguer les clés par le timing). */
function egal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function authentifierApi(req: Request): Auth {
  const cle = extraireCle(req);
  if (!cle) {
    return { ok: false, cle: "", plan: "demo", raison: "Clé d'API absente (en-tête Authorization: Bearer … ou x-api-key)." };
  }

  // Clé de démonstration : toujours valable, fortement limitée.
  if (cle === "demo") return { ok: true, cle: "demo", plan: "demo" };

  const configurees = (process.env.FACTUCHECK_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (configurees.some((k) => egal(k, cle))) {
    return { ok: true, cle, plan: "api" };
  }

  return { ok: false, cle: "", plan: "demo", raison: "Clé d'API invalide." };
}
