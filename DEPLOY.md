# Déploiement de FactuCheck

Ce guide va du plus simple (lancement gratuit, sans base ni paiement) au complet.
**Recommandation : déployez d'abord l'étape 1**, mettez-la devant quelques
utilisateurs, et ne branchez la base + Stripe (étape 2) que lorsque l'intérêt est
confirmé — stocker de vraies factures engage votre responsabilité RGPD.

## Architecture

```
                   ┌───────────────────────────┐
  Navigateur  ───▶ │  App Next.js (Vercel)     │  moteur de règles + schematrons
                   │  /tester, /api/analyser   │  (s'exécutent dans la fonction)
                   └─────────┬─────────┬───────┘
                             │ HTTP    │ HTTP
                   ┌─────────▼──┐  ┌───▼──────────┐
                   │ Service XSD│  │ Service veraPDF│  (conteneurs Docker, Java/xmllint
                   │  :8084     │  │  :8083        │   — impossibles sur Vercel)
                   └────────────┘  └──────────────┘
         (étape 2) Supabase (comptes, historique)  +  Stripe (abonnements)
```

- **L'app fonctionne seule** : sans les services, le rapport affiche « Contrôle
  partiel » (dégradation gracieuse). Sans Supabase/Stripe, elle tourne en « mode
  démo » (le test gratuit marche, pas de compte ni de paiement).

---

## Étape 1 — Lancement gratuit (app + services)

### 1.a Déployer l'app sur Vercel

1. Poussez le dépôt sur GitHub, puis sur [vercel.com](https://vercel.com) :
   **New Project → Import** le dépôt.
2. **Framework** : Next.js (détecté automatiquement).
3. **IMPORTANT — Build Command** (à surcharger) :
   ```
   npm run schematron:official && npm run build
   ```
   Cela récupère les schematrons officiels EN 16931 + FNFE au build et les embarque
   (sans ça, la validation officielle serait absente). Ils restent non versionnés.
4. Région : choisissez une **région UE** (Vercel : `cdg1` Paris).
5. Déployez. L'app est en ligne en « mode démo » : `/tester` fonctionne.

### 1.b Déployer les deux services (conteneurs)

Hôte recommandé pour un solo : **Railway**, **Render** ou **Google Cloud Run**
(tous acceptent un Dockerfile, région UE possible).

```bash
# depuis la racine du repo
docker build -f services/xsd/Dockerfile      -t factucheck-xsd .
docker build -f services/verapdf/Dockerfile  -t factucheck-verapdf .
```

Poussez chaque image chez l'hébergeur, exposez les ports 8084 (xsd) et 8083
(verapdf). **N'exposez PAS ces services sur l'Internet public** : réseau privé, ou
restreignez l'accès à l'app. Notez leurs URLs internes.

### 1.c Brancher les services à l'app

Dans Vercel → Project → **Settings → Environment Variables** :

```
XSD_SERVICE_URL     = http://<hôte-xsd>:8084
VERAPDF_SERVICE_URL = http://<hôte-verapdf>:8083
```

Redéployez. Désormais une facture conforme affiche « Conforme » complet (plus de
« Contrôle partiel »).

> Les deux services sont **optionnels** : si vous voulez lancer encore plus vite,
> sautez 1.b/1.c — l'app marche, le rapport reste « Contrôle partiel » (honnête).

---

## Étape 2 — Comptes, historique et paiements (quand il y a de la traction)

### 2.a Supabase (base, région UE)

1. Créez un projet sur [supabase.com](https://supabase.com), **région UE** (ex.
   Paris/Francfort).
2. Appliquez le schéma : `supabase/schema.sql` (tables comptes/abonnements).
3. **Activez le RLS (Row Level Security)** sur toutes les tables — essentiel.
4. Variables d'env (Vercel) :
   ```
   NEXT_PUBLIC_SUPABASE_URL       = https://<projet>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY  = <clé anon>
   SUPABASE_SERVICE_ROLE_KEY      = <clé service-role>   # serveur uniquement, jamais exposée
   ```

### 2.b Stripe (abonnements)

1. Compte [stripe.com](https://stripe.com) → créez les produits/prix (Pro, Cabinet).
2. Webhook : endpoint `https://<votre-domaine>/api/stripe/webhook`, récupérez le
   secret de signature.
3. Variables d'env :
   ```
   STRIPE_SECRET_KEY                 = sk_live_...
   STRIPE_WEBHOOK_SECRET             = whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= pk_live_...
   STRIPE_PRICE_PRO                  = price_...
   STRIPE_PRICE_CABINET             = price_...
   ```

### 2.c Conformité (obligatoire avant de stocker de vraies factures)

- **Politique de confidentialité / RGPD** et **CGU/CGV** (pages déjà prévues :
  `/mentions-legales`, `/confidentialite`).
- Hébergement UE (Vercel `cdg1` + Supabase UE).
- Rétention : `FACTUCHECK_RETENTION_DAYS` (défaut 30, suppression auto).
- Idéalement, faites relire par un juriste avant d'encaisser.

---

## Variables d'environnement

Voir [`.env.production.example`](./.env.production.example). Toutes sont
**optionnelles** : absentes, la fonctionnalité correspondante se désactive
proprement (mode démo / contrôle partiel).

## Domaine & en-têtes

- Branchez votre domaine chez Vercel (DNS). HTTPS automatique.
- Les en-têtes de sécurité (CSP à nonce, HSTS…) sont déjà posés par le code
  (`next.config.mjs` + `middleware.ts`).

## Rate limiting en production

Le limiteur (`src/lib/rate-limit.ts`) est en mémoire : suffisant en mono-instance.
Sur Vercel (multi-instances), branchez un magasin partagé (Upstash Redis) derrière
la même interface `rateLimit()` pour un vrai plafond global.

## Checklist de mise en ligne

- [ ] App déployée (Build Command avec `schematron:official`)
- [ ] Région UE
- [ ] (option) Services XSD + veraPDF déployés et `*_SERVICE_URL` branchés
- [ ] La facture d'exemple affiche « Conforme » (services branchés)
- [ ] Domaine + HTTPS
- [ ] (étape 2) Supabase UE + RLS activé
- [ ] (étape 2) Stripe + webhook signé
- [ ] (étape 2) Pages RGPD/CGU en ligne
