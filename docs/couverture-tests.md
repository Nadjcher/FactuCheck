# Couverture de tests — par règle, par format, par profil

> Généré par `node scripts/coverage-matrix.mjs` à partir de `rules/*.json`,
> `fixtures-corpus/manifest.json` et `src/lib/engine/*.test.ts`. Ne pas éditer à la main.
> Un « ✓ » n'est posé que si une assertion réelle l'atteste — aucune couverture n'est supposée.

Réponse à la consigne QA n°5. La transparence prime : les cases vides sont des
**trous de couverture connus**, pas masqués.

## Synthèse

| Indicateur | Valeur |
|---|---|
| Règles au catalogue | 28 |
| Source **renseignée** (texte présent) | 28 / 28 |
| Source **formellement vérifiée** (`aVerifier:false`) | 9 / 28 (19 encore « À VÉRIFIER ») |
| Règles avec cas **OK** testé (passe sur facture conforme) | 11 / 28 |
| Règles avec cas **KO** testé (corpus ou unitaire) | 12 / 28 |
| — dont corpus versionné (`fixtures-corpus/`) | 11 |

**Deux niveaux de source.** *Renseignée* = un texte de source est présent dans le
catalogue. *Vérifiée* = ce texte a été confirmé sur une source autoritative (ici
le schematron officiel EN 16931/FNFE embarqué, lui-même validé par différentiel
Saxon) et le drapeau `aVerifier` est passé à `false`. Le squelette initial a tout
marqué « à vérifier » ; on ne bascule qu'après confirmation, jamais par confort.

## Par règle

| specId | ruleId | sévérité | exhaustif | source | cas OK | cas KO |
|---|---|---|---|---|---|---|
| FC-C01 | `MNT-005` | avertissement | oui | ✓ vérifiée | ✓ | ✓ |
| FC-C05 | `MNT-001` | bloquant | oui | ✓ vérifiée | ✓ | ✓ |
| FC-C06 | `MNT-004` | bloquant | oui | ✓ vérifiée | ✓ | — |
| FC-M01 | `NUM-001` | bloquant | oui | ✓ vérifiée | — | ✓ |
| FC-M01 | `NUM-002` | avertissement | oui | ○ à confirmer | — | — |
| FC-M02 | `DAT-001` | bloquant | oui | ✓ vérifiée | — | ✓ |
| FC-M02 | `DAT-002` | avertissement | oui | ○ à confirmer | — | — |
| FC-M04 | `MEN-001` | bloquant | oui | ○ à confirmer | — | ✓ |
| FC-M05 | `MEN-003` | avertissement | oui | ○ à confirmer | — | — |
| FC-M07 | `MEN-002` | bloquant | oui | ○ à confirmer | ✓ | ✓ |
| FC-M08 | `MEN-004` | avertissement | oui | ○ à confirmer | — | ✓ (unit) |
| FC-M09 | `MEN-005` | avertissement | oui | ○ à confirmer | — | — |
| FC-M10 | `MEN-007` | avertissement | oui | ✓ vérifiée | ✓ | — |
| FC-M11 | `MEN-006` | avertissement | oui | ○ à confirmer | — | — |
| FC-M12 | `MEN-009` | bloquant | oui | ○ à confirmer | — | — |
| FC-M13 | `MEN-010` | bloquant | oui | ○ à confirmer | ✓ | ✓ |
| FC-M14 | `MEN-008` | bloquant | oui | ○ à confirmer | ✓ | ✓ |
| FC-S01 | `FMT-001` | bloquant | oui | ○ à confirmer | — | — |
| FC-S02 | `PDF-001` | bloquant | non | ○ à confirmer | ✓ | — |
| FC-S03 | `PDF-003` | bloquant | oui | ○ à confirmer | ✓ | ✓ |
| FC-S04 | `PDF-004` | avertissement | oui | ○ à confirmer | — | — |
| FC-S05 | `FMT-003` | bloquant | oui | ○ à confirmer | ✓ | ✓ |
| FC-S06 | `FMT-005` | bloquant | non | ○ à confirmer | — | ✓ |
| FC-S07 | `FMT-004` | avertissement | oui | ○ à confirmer | — | — |
| — | `FMT-002` | avertissement | oui | ✓ vérifiée | — | — |
| — | `MNT-002` | bloquant | oui | ✓ vérifiée | — | — |
| — | `MNT-003` | avertissement | oui | ✓ vérifiée | — | — |
| — | `PDF-002` | bloquant | oui | ○ à confirmer | ✓ | — |

**Lecture.** *source* : ✓ vérifiée (`aVerifier:false`) · ○ renseignée, à confirmer ·
✗ absente. *cas OK* = une facture conforme ne déclenche pas la règle (statut
`reussi` asserté). *cas KO* = une facture fautive la déclenche (fixture du corpus,
ou assertion unitaire « (unit) »). *exhaustif = non* → la règle ne peut pas conclure
seule à la conformité (PDF/A-3, XSD) : le rapport reste « Contrôle partiel ».

## Par format

| Format | Parsing | Cas OK (conforme) | Cas KO (corpus) | Schematron officiel |
|---|---|---|---|---|
| **CII** | ✓ (`engine.test.ts`) | ✓ (1) | ✓ 10 règle(s) : MEN-002, MEN-001, MNT-001, DAT-001, NUM-001, MEN-008, FMT-003, MEN-010, MNT-005, FMT-005 | ✓ EN16931-CII + FNFE-CII (diff. Saxon : 0 écart) |
| **UBL** | ✓ (`engine.test.ts` + corpus) | ✓ (1) | ✓ 3 règle(s) : MEN-008, MEN-002, MNT-001 | ✓ EN16931-UBL + FNFE-UBL (diff. Saxon : 0 écart) |
| **Factur-X (PDF/A-3)** | extraction XML ✓ (`facturx-pdf.test.ts`) | ✓ (1) | ✓ 1 règle(s) : PDF-003 | s.o. (le XML embarqué suit le profil CII) |

**Fixtures par format** : CII `fixtures-corpus/*.xml`, UBL `fixtures-corpus/*UBL*.xml`,
Factur-X `fixtures-corpus-pdf/*.pdf` (générées par `scripts/make-facturx-pdf.mjs`).

Les schematrons officiels CII **et UBL** (EN 16931 + FNFE-MPE) sont rejoués dans le
test différentiel Saxon avec **0 écart** (30 comparaisons).

**Trou restant.** La validation **PDF/A-3 complète** (veraPDF : profil ICC, output
intent, polices) reste hors moteur → FC-S02/FC-S06 `exhaustif:false`, verdict
« Contrôle partiel ».

## Par profil

| Profil | Couverture |
|---|---|
| **EN 16931** | fixture conforme + schematron officiel EN16931-CII (diff. Saxon 0 écart) |
| **EXTENDED-CTC-FR** | schematron FNFE officiel + 20 fonctions custom portées et testées (`schematron-fnfe.test.ts`) ; diff. Saxon 0 écart |
| **BASIC / MINIMUM / BASIC WL** | couverts seulement par le **refus** (FMT-003 / FC-S05 : profil non accepté en CTC) ; pas de validation de contenu propre |

## Limites assumées (→ « Contrôle partiel »)

- **FC-S02 (PDF/A-3)** et **FC-S06 (XSD)** sont `exhaustif: non` : validation
  structurelle complète = services externes (veraPDF, XSD natif) non branchés.
- **FC-M09** reste « À VÉRIFIER » : passage exact de la norme XP Z12-012 non cité.
- **FC-S05 (FMT-003)** reste « À VÉRIFIER » : règle d'acceptation plateforme
  (spec DGFiP/PDP externe), pas de passage officiel citable à ce stade.
- 19 règles sur 28 restent `aVerifier:true` : la plupart ont une
  source renseignée (CGI, EN 16931) mais pas encore formellement confirmée. À
  basculer au fur et à mesure, uniquement sur source autoritative.

## Régénérer

```bash
node scripts/coverage-matrix.mjs   # réécrit ce fichier
```
