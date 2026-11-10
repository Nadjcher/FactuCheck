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
| Source réglementaire vérifiée | 22 / 28 (6 encore « À VÉRIFIER ») |
| Règles avec cas **OK** testé (passe sur facture conforme) | 11 / 28 |
| Règles avec cas **KO** testé (corpus ou unitaire) | 12 / 28 |
| — dont corpus versionné (`fixtures-corpus/`) | 11 |

## Par règle

| specId | ruleId | sévérité | exhaustif | source | cas OK | cas KO |
|---|---|---|---|---|---|---|
| FC-C01 | `MNT-005` | bloquant | oui | **À VÉRIFIER** | ✓ | ✓ |
| FC-C05 | `MNT-001` | bloquant | oui | **À VÉRIFIER** | ✓ | ✓ |
| FC-C06 | `MNT-004` | bloquant | oui | **À VÉRIFIER** | ✓ | — |
| FC-M01 | `NUM-001` | bloquant | oui | ✓ | — | ✓ |
| FC-M01 | `NUM-002` | avertissement | oui | ✓ | — | — |
| FC-M02 | `DAT-001` | bloquant | oui | ✓ | — | ✓ |
| FC-M02 | `DAT-002` | avertissement | oui | ✓ | — | — |
| FC-M04 | `MEN-001` | bloquant | oui | ✓ | — | ✓ |
| FC-M05 | `MEN-003` | avertissement | oui | ✓ | — | — |
| FC-M07 | `MEN-002` | bloquant | oui | ✓ | ✓ | ✓ |
| FC-M08 | `MEN-004` | avertissement | oui | ✓ | — | ✓ (unit) |
| FC-M09 | `MEN-005` | avertissement | oui | ✓ | — | — |
| FC-M10 | `MEN-007` | avertissement | oui | **À VÉRIFIER** | ✓ | — |
| FC-M11 | `MEN-006` | avertissement | oui | ✓ | — | — |
| FC-M12 | `MEN-009` | bloquant | oui | ✓ | — | — |
| FC-M13 | `MEN-010` | bloquant | oui | ✓ | ✓ | ✓ |
| FC-M14 | `MEN-008` | bloquant | oui | ✓ | ✓ | ✓ |
| FC-S01 | `FMT-001` | bloquant | oui | ✓ | — | — |
| FC-S02 | `PDF-001` | bloquant | non | ✓ | ✓ | — |
| FC-S03 | `PDF-003` | bloquant | oui | ✓ | ✓ | ✓ |
| FC-S04 | `PDF-004` | avertissement | oui | ✓ | — | — |
| FC-S05 | `FMT-003` | bloquant | oui | **À VÉRIFIER** | ✓ | ✓ |
| FC-S06 | `FMT-005` | bloquant | non | ✓ | — | ✓ |
| FC-S07 | `FMT-004` | avertissement | oui | ✓ | — | — |
| — | `FMT-002` | avertissement | oui | ✓ | — | — |
| — | `MNT-002` | bloquant | oui | ✓ | — | — |
| — | `MNT-003` | avertissement | oui | **À VÉRIFIER** | — | — |
| — | `PDF-002` | bloquant | oui | ✓ | ✓ | — |

**Lecture.** *cas OK* = une facture conforme ne déclenche pas la règle (statut
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
- 6 règles sans source officielle vérifiée restent « À VÉRIFIER ».

## Régénérer

```bash
node scripts/coverage-matrix.mjs   # réécrit ce fichier
```
