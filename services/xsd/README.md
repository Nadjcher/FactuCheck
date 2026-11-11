# Microservice XSD (validation structurelle)

FactuCheck (Next.js serverless) ne peut pas charger les schémas XSD officiels
(multi-fichiers, volumineux, licences tierces) ni exécuter `xmllint` par requête.
La validation **structurelle/syntaxique** est donc déléguée à ce microservice,
appelé par le moteur (`src/lib/engine/xsd-service.ts`).

C'est le pendant « syntaxe » du microservice veraPDF (« conteneur PDF/A-3 ») et du
Schematron (« sémantique EN 16931 / FNFE »).

## API

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| `GET` | `/health` | — | `{ "ok": true }` |
| `POST` | `/validate?format=CII\|UBL` | XML (`application/xml`) | verdict JSON |

```json
{ "format": "CII", "valid": false, "errors": [{ "line": 34, "message": "…" }] }
```

## Schémas officiels

Récupérés par `scripts/fetch-xsd.mjs` dans `services/xsd/schemas/` (non versionnés) :
- **UBL 2.1** — OASIS (`os-UBL-2.1`), point d'entrée `ubl/maindoc/UBL-Invoice-2.1.xsd`.
- **CII Factur-X EN 16931 (v1.09)** — extrait du paquet PyPI `factur-x` (qui
  redistribue les XSD UN/CEFACT), point d'entrée `cii/Factur-X_EN16931.xsd`.

## Lancer en local

```bash
npm run xsd:setup                 # récupère les schémas (services/xsd/schemas/)
SCHEMAS_DIR=services/xsd/schemas node services/xsd/server.mjs
# xsd-service à l'écoute sur :8084
export XSD_SERVICE_URL=http://localhost:8084
```

## Déployer (Docker — build depuis la racine du repo)

```bash
docker build -f services/xsd/Dockerfile -t factucheck-xsd .
docker run -p 8084:8084 factucheck-xsd
# puis, côté app : XSD_SERVICE_URL=http://<hôte>:8084
```

## Comportement côté app

- Service joignable → le verdict surcharge **FMT-005 (FC-S06)** : bloquant réel si
  la structure XSD est invalide, réussi sinon. Combiné au service veraPDF, les deux
  seuls axes « partiels » (PDF/A-3 + XSD) sont couverts → le rapport peut être
  **pleinement exhaustif** (plus de « Contrôle partiel »).
- Non configuré / injoignable → dégradation gracieuse (contrôle best-effort,
  `exhaustif:false`). Aucune exception.

## Sécurité (déploiement)

Ce service n'a pas d'authentification et traite des fichiers non fiables. À
déployer **en réseau interne uniquement** (réseau privé / cluster), jamais exposé
directement sur Internet : l'app FactuCheck l'appelle en interne. Protéger l'accès
par le réseau (pas de port public) et, si besoin, une passerelle d'authentification.
Les limites de taille (corps max) et l'absence de shell (`execFile`) bornent déjà
l'abus, mais l'isolation réseau reste la première défense.
