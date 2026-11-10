# Validation différentielle du moteur Schematron

> Réponse au risque QA n°1 : « le préprocesseur maison peut donner des résultats
> différents de l'officiel sans que personne ne le voie. »

FactuCheck exécute les schematrons officiels avec **node-schematron** (pur JS) et
un préprocesseur maison (`src/lib/engine/schematron-transform.ts`) qui :
- développe les patterns abstraits `is-a`/`param` (EN 16931) ;
- réécrit les `<let>` en `let … return` XPath natif (node-schematron les atomise) ;
- remplace les fonctions XSLT `custom:*` (FNFE) par des portages JS.

Chacune de ces transformations peut introduire un écart avec un moteur XSLT
standard. Ce test le mesure.

## Méthode

Pour chaque facture et chaque schematron, on compare **l'ensemble des règles
signalées** par deux moteurs :

1. **Référence** — **Saxon-HE 12.5** (Java), qui compile le schematron officiel
   **brut** via le pipeline ISO standard (`iso_dsdl_include` → `iso_abstract_expand`
   → `iso_svrl_for_xslt2`) puis valide la facture → SVRL → identifiants des
   `failed-assert` / `successful-report`.
2. **Nous** — `validerSchematron()`, exactement le code de production (préprocesseur
   maison + fonctions JS + node-schematron).

Tout identifiant présent d'un côté et pas de l'autre est un **écart** — donc un bug.

## Résultat

Sur **EN 16931 (CII)** et **FNFE-MPE EXTENDED-CTC-FR (CII)**, appliqués à tout
`fixtures-corpus/` (facture conforme + une invalide par règle) ainsi qu'aux
factures d'exemple officielles du FNFE (UC13 valide + altérée) :

**0 écart** — les deux moteurs signalent exactement les mêmes règles sur chaque
facture (22 comparaisons sur le corpus versionné, 26 avec les exemples officiels).

Le préprocesseur maison est donc **fidèle au moteur de référence** sur ce
périmètre. Le test doit être rejoué à chaque évolution du préprocesseur ou mise à
jour des schematrons officiels, et élargi au fur et à mesure (UBL, autres profils,
davantage de factures).

## Rejouer

```bash
npm run diff:setup   # télécharge Saxon + squelette ISO, compile les XSLT de référence (.saxon/)
npm run diff:run     # compare les deux moteurs sur fixtures-corpus/
```

Le test (`src/lib/engine/differential.saxon.test.ts`) s'ignore automatiquement si
`SAXON_DIR` n'est pas défini (CI sans Java).

## Pourquoi node-schematron et pas SaxonJS ?

SaxonJS exécute XSLT 3.0 en JavaScript, mais :
- il faut d'abord **compiler** le schematron en XSLT (le pipeline ISO ci-dessus, qui
  nécessite Saxon/Java), puis compiler ce XSLT en **SEF** (format propre à SaxonJS) —
  on ne supprime donc pas la dépendance à la chaîne Java au build ;
- le runtime SaxonJS est lourd et la compilation SEF du XSLT de validation (plusieurs
  centaines de Ko) est coûteuse.

**node-schematron** (pur JS, sans étape de build ni dépendance native) a été retenu
pour la simplicité et le déploiement serverless. Son risque — diverger du moteur de
référence sur les transformations maison — est précisément **couvert par ce test
différentiel** contre Saxon. En production, on peut aussi déléguer la validation à
un service Saxon si une équivalence au bit près devient exigée.
