# Validation Schematron

FactuCheck exécute une validation **Schematron** sur le XML de la facture
(CII/Factur-X et UBL), en plus des contrôles « métier » internes. Le moteur est
`node-schematron` (pur JavaScript, aucune dépendance Saxon/Java), appelé depuis
`src/lib/engine/schematron.ts`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `factucheck-cii.sch` / `factucheck-ubl.sch` | Schematrons **maison** (sous-ensemble sourcé, « à vérifier »). |
| `official/cii.sch` / `official/ubl.sch` | **EN 16931** officiel (ConnectingEurope) — prioritaire. |
| `official/fnfe-cii.sch` / `official/fnfe-ubl.sch` | **BR-FR FNFE-MPE** (EXTENDED-CTC-FR) — exécuté **en plus** de l'EN 16931. |

Résolution automatique par format : si des `official/*.sch` existent, **tous**
ceux du format sont appliqués (EN 16931 **et** FNFE-MPE) et leurs anomalies
cumulées ; sinon le schematron maison. Le rapport indique la **source** utilisée
et marque « À VÉRIFIER » uniquement pour les schematrons maison.

Deux obstacles techniques propres à `node-schematron` sont levés automatiquement
au chargement (`src/lib/engine/schematron-transform.ts`) :
- les **fonctions XSLT** `custom:*` du FNFE sont portées en JS et enregistrées
  dans fontoxpath (`src/lib/engine/schematron-functions.ts`) ;
- les **`<let>`** (que node-schematron atomise à tort) sont réécrits en
  expressions `let … return` XPath natives.

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
npm run schematron:official          # EN 16931 (master) + FNFE-MPE EXTENDED-CTC-FR
npm run schematron:official -- v1.3.14.1   # fige la version EN 16931 (tag)
```

Le script télécharge **EN 16931** (CII + UBL, `ConnectingEurope/eInvoicing-EN16931`,
EUPL) **et** les schematrons **FNFE-MPE** EXTENDED-CTC-FR (CII + UBL,
`fnfempe/France_RFE`, EUPL), puis les écrit dans `schematron/official/`.
Redémarrez ensuite l'application.

> Vérifié de bout en bout via `node-schematron` : EN 16931 CII/UBL et FNFE-MPE
> EXTENDED-CTC-FR CII/UBL s'exécutent ; les factures d'exemple **officielles**
> valides du FNFE passent sans anomalie bloquante, et une facture altérée
> déclenche bien la règle BR-FR correspondante.

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
