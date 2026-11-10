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

## Brancher les artefacts officiels (recommandé avant production)

1. Récupérez les artefacts **préprocessés** (includes résolus) :
   - **EN 16931 (CII & UBL)** — dépôt `ConnectingEurope/eInvoicing-EN16931`
     (Apache-2.0). Utilisez les `.sch` préprocessés ou compilez-les depuis les
     sources (`iso_dsdl_include` puis `iso_abstract_expand`).
   - **Factur-X / FNFE-MPE** — schematrons spécifiques aux profils français
     (EXTENDED-CTC-FR), selon la licence du FNFE-MPE.
2. Déposez-les sous `schematron/official/cii.sch` et `schematron/official/ubl.sch`.
3. Redémarrez l'application : ils sont pris en compte automatiquement et marqués
   comme source **officielle** (plus « À VÉRIFIER »).

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
