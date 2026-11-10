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
| Règles avec cas **OK** testé (passe sur facture conforme) | 8 / 28 |
| Règles avec cas **KO** testé (corpus ou unitaire) | 11 / 28 |
| — dont corpus versionné (`fixtures-corpus/`) | 10 |

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
| FC-S02 | `PDF-001` | bloquant | non | ✓ | — | — |
| FC-S03 | `PDF-003` | bloquant | oui | ✓ | — | — |
| FC-S04 | `PDF-004` | avertissement | oui | ✓ | — | — |
| FC-S05 | `FMT-003` | bloquant | oui | **À VÉRIFIER** | ✓ | ✓ |
| FC-S06 | `FMT-005` | bloquant | non | ✓ | — | ✓ |
| FC-S07 | `FMT-004` | avertissement | oui | ✓ | — | — |
| — | `FMT-002` | avertissement | oui | ✓ | — | — |
| — | `MNT-002` | bloquant | oui | ✓ | — | — |
| — | `MNT-003` | avertissement | oui | **À VÉRIFIER** | — | — |
| — | `PDF-002` | bloquant | oui | ✓ | — | — |

**Lecture.** *cas OK* = une facture conforme ne déclenche pas la règle (statut
`reussi` asserté). *cas KO* = une facture fautive la déclenche (fixture du corpus,
ou assertion unitaire « (unit) »). *exhaustif = non* → la règle ne peut pas conclure
seule à la conformité (PDF/A-3, XSD) : le rapport reste « Contrôle partiel ».

## Par format

| Format | Parsing | Cas OK (conforme) | Cas KO (corpus) | Schematron officiel |
|---|---|---|---|---|
| **CII** | ✓ (`engine.test.ts`) | ✓ fixture `CII_VALIDE` | ✓ 10 règles | ✓ EN16931-CII + FNFE-CII (diff. Saxon : 0 écart) |
| **UBL** | ✓ (`engine.test.ts`) | — *(pas de fixture conforme UBL)* | — *(aucune fixture KO UBL)* | fonctions FNFE portées + testées ; schematron non rejoué en diff |
| **Factur-X (PDF/A-3)** | extraction XML ✓ | — | — *(aucune fixture PDF)* | s.o. (le XML suit le profil CII) |

**Trou connu.** Le corpus KO et les cas OK sont aujourd'hui **CII uniquement**.
UBL n'a que des tests de parsing ; aucune fixture PDF/A-3 réelle. À combler avant
d'annoncer « UBL » ou « Factur-X » comme pleinement couverts.

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
