# Carte réglementaire & backlog des règles

> Synthèse de cadrage pour alimenter `rules/*.json` et le moteur. **Non juridique.**
> Les textes évoluent (XP Z12-012 révisée en juin 2026). **À faire valider par un
> expert-comptable avant commercialisation.** Les identifiants EN 16931 (BR-CO-xx,
> BT-xx) cités ici sont à **confirmer sur le schematron officiel**.

## 1. Cadre légal

- **Calendrier**
  - Réception obligatoire pour **toutes** les entreprises : **01/09/2026**.
  - Émission obligatoire grandes entreprises & ETI : **01/09/2026**.
  - Émission obligatoire PME & micro-entreprises : **01/09/2027**.
- **Circuit** : portail public abandonné (loi de finances 2026) → tout passe par une
  **plateforme privée agréée**, en émission comme en réception.
- **Formats** : Factur-X, UBL, CII. Un PDF ordinaire n'est **pas** une facture électronique.
- **Normes** : EN 16931 (modèle européen) + AFNOR **XP Z12-012** (formats & statuts),
  **XP Z12-013** (API), **XP Z12-014** (cas d'usage).

## 2. Sanctions (loi de finances 2026, art. 123)

| Manquement | Amende |
|---|---|
| Facture non émise en électronique | 50 € / facture — plafond 15 000 €/an |
| E-reporting non transmis | 500 € / transmission — plafond 15 000 €/an |
| Pas de plateforme en réception | 500 €, puis 1 000 € / trimestre après mise en demeure |

## 3. Règles de gestion

### Implémentées dans le moteur (voir `rules/*.json`)
| ID | Objet | Sévérité |
|---|---|---|
| FMT-001 | Format reconnu (Factur-X/UBL/CII) | bloquant |
| FMT-002 | Profil déclaré (BT-24) | avertissement |
| **FMT-003** | **Profil accepté par les plateformes (EN 16931 / EXTENDED-CTC-FR)** | **bloquant** |
| PDF-001..004 | PDF/A-3, XML embarqué, nom `factur-x.xml`, XMP | bloquant/avert. |
| MEN-001/002 | SIREN émetteur / **SIREN client (nouveau)** | bloquant |
| MEN-003 | N° TVA émetteur (BT-31) | avertissement |
| MEN-004 | Adresse de livraison si différente (nouveau) | avertissement |
| MEN-005 | Catégorie opération LB/PS/LBPS (nouveau) | avertissement |
| MEN-006 | Référence d'exonération si TVA = 0 | avertissement |
| MNT-001 | HT + TVA = TTC (BR-CO-15) | bloquant |
| MNT-002 | Montant dû présent (BT-115) | bloquant |
| MNT-003 | Montants positifs (facture vs avoir, BT-3) | avertissement |
| DAT-001/002 | Date d'émission présente/valide (BT-2) | bloquant/avert. |
| NUM-001/002 | Numéro présent / exploitable (BT-1) | bloquant/avert. |

### Via Schematron (voir `schematron/`) — déjà en place
- **BR-CO-10** : total des lignes = somme des montants nets de chaque ligne. ✅ (CII/UBL)
- **BR-CO-13** : Total HT = lignes − remises + frais. ✅ (CII)
- **BR-CO-15** : TTC = HT + TVA. ✅ (CII/UBL)
- **BR-CO-17** : TVA par taux = base × taux, arrondie à 2 décimales. ✅ (CII/UBL)
- **BR-CO-03** : date (BT-7) et code (BT-8) d'exigibilité TVA mutuellement exclusifs. ✅ (CII)
- **BR-FR-CTC-01** : SIREN du client obligatoire. ✅ (CII/UBL)

### Moteur métier — déjà en place
- **BT-8** : code d'exigibilité de la TVA (option « sur les débits ») extrait et
  contrôlé (règle MEN-007). ✅ (CII/UBL)

### Backlog restant
- Tolérance **1 centime par ligne** spécifique EXTENDED-CTC-FR (affiner par rapport
  au cumul actuel).
- Contrôle fin des **nouvelles mentions** au niveau ligne.
- **Déposer les schematrons officiels** (EN 16931 / FNFE-MPE) dans `schematron/official/`.

## 4. Cycle de vie (XP Z12-012) — hors contrôle fichier, à modéliser

- Statuts obligatoires : **Déposée, Rejetée, Refusée, Encaissée**.
- **Rejet** = blocage technique → la facture **n'a jamais existé fiscalement**.
- **Refus** = décision du client → la facture **existe** et ne s'annule que par un **avoir** ;
  le refus **doit** porter un **motif** pris dans la liste de la norme XP Z12-012
  (ex. taux de TVA erroné, montant total erroné…). → cf. `rules/motifs-refus.json`.

## 5. E-reporting (hors MVP)

Couvre B2C, international, données de paiement. Périodicité selon le régime de TVA :
décade (réel normal mensuel), mensuel (simplifié), bimestriel (franchise).

## 6. Architecture Schematron — EN PLACE

Le moteur Schematron est **intégré** (`node-schematron`, pur JS ; voir
`schematron/README.md` et `src/lib/engine/schematron.ts`) :
- La validation Schematron s'exécute sur le XML extrait, **en complément** des
  contrôles « métier » et pédagogiques de FactuCheck.
- Chaque assertion échouée est mappée vers un `Finding` (sévérité lue du `flag`),
  affiché dans une section dédiée du rapport, et intégré à la conformité globale.
- Nos règles à forte valeur UX (FMT-003 profil accepté, explications, score) sont
  conservées par-dessus.
- **Officiel EN 16931 + FNFE-MPE** : `npm run schematron:official` télécharge et
  prépare les schematrons **EN 16931** (CII + UBL) **et** **FNFE-MPE EXTENDED-CTC-FR**
  (CII + UBL) → `schematron/official/` (prioritaires, « non à vérifier »). Le FNFE
  définit des fonctions XSLT `custom:*` (portées en JS) et des `<let>` (réécrits en
  `let … return` natif) pour être exécutables par node-schematron. Vérifié : les
  factures d'exemple officielles FNFE valides passent, une facture altérée déclenche
  la règle BR-FR correspondante.

## 7. Sources

- impots.gouv — Approfondir la réforme : https://www.impots.gouv.fr/japprofondis-mes-connaissances-sur-la-reforme
- impots.gouv — Données de facture : https://www.impots.gouv.fr/facturation-electronique-donnees-de-facture
- impots.gouv — Norme AFNOR XP Z12-012 : https://www.impots.gouv.fr/factures-norme-afnor
- economie.gouv — Nouvelles mentions : https://www.economie.gouv.fr/node/3240685
- FNFE-MPE — Check-list volet B : https://fnfe-mpe.org/wp-content/uploads/2026/09/2026-09-07-RFE-Check-List-Demarrage-Volet-B-VF.pdf
- FNFE-MPE — Check-list volet A : https://fnfe-mpe.org/wp-content/uploads/2026/09/2026-09-07-RFE-Check-List-Demarrage-Volet-A-VF.pdf
- KPMG Avocats — LF 2026, art. 123 : https://kpmg.com/av/fr/avocats/eclairages/2026/03/facturation-electronique-amenagement-des-obligations-et-renforcement-des-sanctions.html
- L'Expert-Comptable — LF 2026 : https://www.l-expert-comptable.com/a/facturation-electronique-loi-de-finances-2026
- Squair — Sanctions et tolérance : https://www.squairlaw.com/fr/blog/facturation-electronique-obligatoire-pas-encore-pret-au-1er-septembre-2026-sanctions-tolerance-et-solutions
- Ma facture électronique — Profils Factur-X : https://ma-facture-electronique.org/?p=1704
- Ma facture électronique — EXTENDED-CTC-FR : https://ma-facture-electronique.org/formats-normes/profil-extended-ctc-fr/
- Ma facture électronique — Statuts : https://ma-facture-electronique.org/?p=1672
- Legifiscal — Périodicité e-reporting : https://www.legifiscal.fr/creation-entreprise/e-reporting-periodicite.html
- EN 16931-1 — diffusée gratuitement par l'AFNOR.
