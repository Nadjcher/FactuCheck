# Microservice veraPDF (validation PDF/A-3)

FactuCheck tourne en JavaScript (Next.js serverless) et ne peut pas exécuter
veraPDF (Java) à chaque requête. La validation **PDF/A-3 complète** (ISO 19005-3)
est donc déléguée à ce microservice, appelé en HTTP par le moteur
(`src/lib/engine/verapdf-service.ts`).

## API

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| `GET` | `/health` | — | `{ "ok": true }` |
| `POST` | `/validate?flavour=3b` | octets PDF (`application/pdf`) | verdict JSON |

Verdict :

```json
{
  "flavour": "3b",
  "compliant": true,
  "passedChecks": 192,
  "failedChecks": 0,
  "failures": [{ "clause": "6.1.3", "message": "…" }]
}
```

`flavour` : profil PDF/A visé (`3b` = PDF/A-3 niveau B, cible Factur-X).

## Lancer en local

```bash
# 1. Installer veraPDF (depuis la racine du repo)
npm run verapdf:setup            # → .verapdf/app/verapdf

# 2. Démarrer le service
VERAPDF_CLI=.verapdf/app/verapdf node services/verapdf/server.mjs
# verapdf-service à l'écoute sur :8083

# 3. Pointer l'app dessus
export VERAPDF_SERVICE_URL=http://localhost:8083
```

## Déployer (Docker)

```bash
# build depuis la racine du repo
docker build -f services/verapdf/Dockerfile -t factucheck-verapdf .
docker run -p 8083:8083 factucheck-verapdf
# puis, côté app : VERAPDF_SERVICE_URL=http://<hôte>:8083

# ou les deux services d'un coup :
docker compose -f services/docker-compose.yml up --build
```

## Comportement côté app

- `VERAPDF_SERVICE_URL` **défini et service joignable** : le verdict veraPDF
  surcharge la règle **PDF-001 (FC-S02)** — bloquant réel si non conforme,
  réussi si conforme (le contrôle PDF/A-3 cesse d'être « partiel »).
- **Non configuré ou injoignable** : dégradation gracieuse — le moteur retombe
  sur le contrôle de marqueurs PDF/A-3, et le rapport reste « Contrôle partiel »
  (`exhaustif:false`). Aucune exception n'est levée.

> Note : même avec veraPDF branché, le rapport peut rester « Contrôle partiel »
> tant que la validation **XSD** (FC-S06 / FMT-005) n'est pas, elle aussi,
> exhaustive — c'est volontaire et affiché honnêtement.
