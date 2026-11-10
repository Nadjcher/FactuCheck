# FactuCheck

> **Testez vos factures électroniques avant envoi. Zéro rejet, zéro retard de paiement.**

SaaS B2B (français) pour contrôler la conformité des factures électroniques
(Factur-X, UBL, CII) avant transmission, dans le contexte de la réforme française
de la facturation électronique.

---

## ⚠️ Avertissement réglementaire (à lire)

La valeur de FactuCheck, ce sont **les règles de contrôle**. Elles ne doivent
jamais être inventées. Dans ce dépôt, **toutes les règles sont marquées
« À VÉRIFIER »** (`aVerifier: true`, `source: null`) : leurs verdicts sont
**indicatifs** et ne constituent pas un avis réglementaire.

Pour les fiabiliser, renseignez le champ `source` de chaque règle dans
`rules/*.json` depuis les spécifications officielles (EN 16931, Factur-X du
FNFE-MPE, DGFiP, ISO 19005-3 pour PDF/A-3), puis passez `aVerifier` à `false`.
Voir **`rules/README.md`**. Un test (`engine.test.ts`) garde ce contrat :
une règle avec `source` doit avoir `aVerifier: false`, et inversement.

---

## Démarrer

```bash
npm install
cp .env.example .env.local   # optionnel : l'app tourne sans clés (mode démo)
npm run dev                  # http://localhost:3000
```

Sans clés Supabase/Stripe, l'application démarre en **mode démonstration**
(auth simulée, données de démo, paiement désactivé). Les parcours de test de
facture, le rapport et l'export PDF fonctionnent entièrement, sans compte.

### Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` / `start` | build et serveur de production |
| `npm run test` | tests unitaires du moteur (Vitest) |
| `npm run test:e2e` | tests end-to-end (Playwright) |
| `npm run typecheck` | vérification TypeScript |

---

## Stack

- **Next.js 14 (App Router) + TypeScript + Tailwind** — UI, i18n (fr), thème clair/sombre
- **Moteur de règles** — `src/lib/engine/*`, isolé de l'UI et de la base, 100 % testable
- **Validation Schematron** — `node-schematron` (pur JS), par-dessus le moteur métier
  (voir `schematron/README.md`), avec contrôles au niveau ligne (BR-CO-10/13)
- **Supabase** — auth, Postgres (RLS), stockage (voir `supabase/schema.sql`)
- **Stripe** — abonnements (Gratuit / Pro / Cabinet)
- **Analyse PDF & XML côté serveur** — route `POST /api/analyser`

---

## Le moteur de règles

```
fichier (PDF/A-3, XML UBL ou CII)
   │  parseInvoice()        ← détection format + extraction (src/lib/engine/parse.ts)
   ▼
ParsedInvoice (modèle normalisé)
   │  evaluer()             ← applique checks.ts selon le catalogue rules/*.json
   ▼
Report { score /100, conforme, findings[], counts, … }
```

- Formats : **Factur-X** (XML CII embarqué dans un PDF/A-3, extrait au mieux),
  **UBL**, **CII**.
- Chaque règle produit un statut **Réussi / Avertissement / Bloquant / Non applicable**,
  avec message en langage clair et « comment corriger ».
- Score pondéré (bloquant = 3, avertissement = 1) ; `conforme` = aucun bloquant.

Catalogue déclaratif : `rules/format.json`, `pdf-facturx.json`, `mentions.json`,
`montants.json`, `dates-numerotation.json`. Implémentation : `src/lib/engine/checks.ts`.

---

## État d'avancement

### ✅ Fait (fonctionnel)
- Moteur de règles complet + **33 tests unitaires** (factures valides/invalides)
- Catalogue `rules/*.json` **sourcé** (EN 16931, Factur-X FNFE-MPE, CGI, LF 2026),
  marqué « À VÉRIFIER » en attente de validation experte ; inclut le **BT-8**
  (code d'exigibilité de la TVA, option « sur les débits »)
- **Validation Schematron** branchée (CII + UBL) : exécute les `.sch` maison
  (sourcés) ou les **artefacts officiels** — **EN 16931** et **FNFE-MPE
  EXTENDED-CTC-FR** — via `npm run schematron:official` (téléchargement, résolution
  des includes, développement des patterns abstraits, portage des fonctions XSLT
  `custom:*` en JS et réécriture des `<let>`). Contrôles de calcul au niveau ligne
  et par taux (BR-CO-10/13/15/17) + règles françaises BR-FR ; intégrés au score et
  à la conformité. Vérifié : les factures d'exemple officielles FNFE passent sans
  bloquant
- Page **Tester une facture** : glisser-déposer, lot, **sans compte**, barre de
  progression, **facture d'exemple**
- **Rapport détaillé** : score /100, erreurs en langage simple, « comment corriger »,
  source + badge À VÉRIFIER, **export PDF** (impression)
- **Tableau de bord** : taux de conformité, top 5 causes, évolution, filtre par client
- **Espace cabinet** (clients + rôles), **Historique** + recherche, **Paramètres**
  (abonnement, clé API, rétention, export/suppression RGPD)
- Landing, tarifs, FAQ, onboarding 3 écrans, connexion/inscription
- Pages légales (mentions, RGPD), **thème clair/sombre**, responsive mobile-first,
  accessibilité (focus visible, libellés, couleurs doublées d'icônes)
- API REST d'analyse, scaffold Stripe (checkout + webhook), schéma Supabase + RLS
- **3 tests e2e** Playwright (landing, test d'une facture, recherche historique)

### 🔜 Reste à faire (avant production)
- **Faire valider l'ensemble par un expert-comptable** et suivre les mises à jour
  des schematrons officiels (EN 16931 et FNFE-MPE) — priorité n°1
- Brancher l'écriture réelle en base (Supabase) : persistance factures/rapports,
  quotas, journal d'audit, purge automatique via tâche planifiée
- Finaliser Stripe (prix réels, mise à jour `subscriptions` sur webhook)
- Extraction PDF Factur-X plus robuste (parser PDF complet) et validation XSD/Schematron
- Politique de confidentialité complète, DPA sous-traitants, mentions légales à compléter
- Durcir les droits RLS par rôle (lecture seule pour `client_lecture`)

---

## Structure

```
rules/                 catalogue de règles (déclaratif, sourcé) + REGLEMENTATION.md
schematron/            schematrons maison (.sch) + official/ (artefacts officiels)
src/
  lib/engine/          moteur : parse, checks, scoring, schematron, formats (UBL/CII/PDF)
  lib/i18n/            textes (fr ; en à ajouter)
  lib/supabase, stripe intégrations (dégradation gracieuse)
  components/          UI (ui/, rapport/, tester/, app/)
  app/(marketing)      landing, tester, tarifs, légal
  app/(auth)           connexion, inscription, onboarding
  app/(app)            tableau de bord, clients, historique, paramètres
  app/api/             analyser, exemple, stripe/*
supabase/schema.sql    tables + RLS
tests-e2e/             Playwright
```
