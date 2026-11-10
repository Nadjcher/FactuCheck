# Validation Schematron

FactuCheck exécute une validation **Schematron** sur le XML de la facture
(CII/Factur-X et UBL), en plus des contrôles « métier » internes. Le moteur est
`node-schematron` (pur JavaScript, aucune dépendance Saxon/Java), appelé depuis
`src/lib/engine/schematron.ts`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `factucheck-cii.sch` | Schematron **maison** pour CII/Factur-X (sous-ensemble sourcé, « à vérifier »). |
| `factucheck-ubl.sch` | Schematron **maison** pour UBL. |
| `official/cii.sch` | *(optionnel)* Schematron **officiel** CII — **prioritaire** s'il est présent. |
| `official/ubl.sch` | *(optionnel)* Schematron **officiel** UBL — **prioritaire** s'il est présent. |

La résolution est automatique : pour une facture CII/Factur-X, `official/cii.sch`
est utilisé s'il existe, sinon `factucheck-cii.sch`. Idem UBL. Le rapport indique
toujours la **source** utilisée et marque « À VÉRIFIER » tant que le schematron
n'est pas officiel.

## Ce que les schematrons maison apportent déjà

Des contrôles que le moteur « métier » ne faisait pas, notamment **au niveau ligne** :

- **BR-CO-10** : total des lignes = somme des montants nets de chaque ligne.
- **BR-CO-13** : total HT = total des lignes − remises + frais.
- **BR-CO-15** : TTC = HT + TVA.
- **BR-FR-CTC-01** : SIREN du client obligatoire.

Le `flag` de chaque assertion (`fatal` → bloquant, `warning` → avertissement) est
lu depuis le `.sch`.

## Brancher les artefacts officiels EN 16931 (automatisé)

Un script récupère les schematrons officiels EN 16931 (CII + UBL) depuis le dépôt
`ConnectingEurope/eInvoicing-EN16931` (**EUPL 1.2**), **résout les `<include>` et
développe les patterns abstraits** (`is-a`/`param`) pour produire des `.sch`
autonomes exécutables, puis les dépose dans `schematron/official/` :

```bash
npm run schematron:official          # branche master
npm run schematron:official -- v1.3.14.1   # une version précise (tag)
```

Redémarrez ensuite l'application : `schematron/official/cii.sch` et `ubl.sch`
deviennent **prioritaires** et sont marqués source **officielle** (plus
« À VÉRIFIER »).

> Vérifié : les schematrons officiels EN 16931 CII et UBL s'exécutent de bout en
> bout via `node-schematron` après ce préprocessing, et la facture d'exemple
> fournie passe la validation officielle CII sans anomalie.

Les scripts : `scripts/fetch-official-schematron.mjs` (téléchargement) et
`scripts/preprocess-schematron.mjs` (includes + expansion abstraite, réutilisable
pour d'autres schematrons, dont ceux du **FNFE-MPE** pour EXTENDED-CTC-FR).

### Dépôt manuel (alternative)
Vous pouvez aussi déposer vous-même des `.sch` déjà préprocessés sous
`schematron/official/cii.sch` et `schematron/official/ubl.sch`.

> **Compatibilité** : `node-schematron` s'appuie sur `fontoxpath` (XPath 3.1).
> La grande majorité des assertions EN 16931 fonctionne, mais certaines
> constructions avancées (fonctions XPath personnalisées, codelists externes
> chargées par `<include>`) peuvent nécessiter un `.sch` déjà préprocessé ou
> l'enregistrement de fonctions via `registerCustomXPathFunction`. Vérifiez le
> `note` du bloc Schematron du rapport en cas de souci.

## Licence

Les schematrons maison (`factucheck-*.sch`) font partie de ce dépôt. Les artefacts
officiels déposés dans `official/` restent soumis à **leur propre licence** et ne
sont pas versionnés ici (voir `.gitignore`).
