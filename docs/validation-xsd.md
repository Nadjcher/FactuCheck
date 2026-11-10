# Validation XSD (structure / syntaxe)

> Dernier axe structurel (FC-S06 / FMT-005). Avec PDF/A-3 (veraPDF) et XSD branchés,
> il n'y a plus d'axe « Contrôle partiel » structurel.

## Trois couches de validation

| Couche | Quoi | Outil | Où |
|---|---|---|---|
| **Syntaxe / structure** | éléments, ordre, types de données | **XSD** (xmllint) | `services/xsd/` |
| **Sémantique** | règles de gestion EN 16931 / FNFE | Schematron | en interne (node-schematron, vérifié Saxon) |
| **Conteneur** | PDF/A-3 (ISO 19005-3) | veraPDF | `services/verapdf/` |

Les trois sont complémentaires : une facture peut être valide XSD (bien structurée)
mais violer une règle de gestion (Schematron), ou l'inverse.

## Schémas officiels

- **CII** : profil Factur-X **EN 16931 v1.09** (schémas UN/CEFACT CrossIndustryInvoice),
  point d'entrée `Factur-X_EN16931.xsd`.
- **UBL** : **OASIS UBL 2.1**, point d'entrée `UBL-Invoice-2.1.xsd`.

Récupérés par `scripts/fetch-xsd.mjs` (UBL depuis OASIS, CII depuis le paquet PyPI
`factur-x` qui redistribue les XSD UN/CEFACT), non versionnés (licences tierces).

## Comment c'est branché

- **Service** : `services/xsd/server.mjs` (xmllint) — `POST /validate?format=CII|UBL`.
- **Client** : `src/lib/engine/xsd-service.ts` (`validerXsd`), piloté par `XSD_SERVICE_URL`.
- **Intégration** : `analyserFichierComplet` appelle le service pour tout XML de
  facture (en parallèle de veraPDF et du Schematron) et **surcharge FMT-005 (FC-S06)** :
  - structure valide → FMT-005 **réussi** ;
  - structure invalide → FMT-005 **bloquant**, avec les erreurs (ligne + message).
- **Dégradation gracieuse** : sans `XSD_SERVICE_URL` ou service injoignable, le moteur
  retombe sur le contrôle best-effort interne (`exhaustif:false`).

## Fermeture de l'exhaustivité

PDF-001 (PDF/A-3) et FMT-005 (XSD) sont les **deux seuls** axes `exhaustif:false`.
Quand les deux services (veraPDF + xsd) sont branchés et concluants, le rapport
devient **pleinement exhaustif** : plus de « Contrôle partiel ».

Prouvé par `src/lib/engine/validation-closure.test.ts` (exécuté avec les deux
services réels) : sur `OK_FACTURX_conforme.pdf`, `report.exhaustif === true`,
PDF-001 et FMT-005 en « réussi ».

> La **conformité** globale (`conforme`) reste indépendante : elle intègre aussi le
> Schematron sémantique. Une facture peut être structurellement exhaustive et
> néanmoins signalée par une règle de gestion — c'est volontaire.

## Preuve (exécutée en dev)

```
xmllint + schémas officiels :
  OK_CII_conforme.xml        → valid   (structure CII correcte)
  KO_FC-S06_structure.xml    → invalid (ligne 34 : BuyerTradeParty manquant)
  OK_UBL_conforme.xml        → valid   (structure UBL correcte)
```

## Rejouer

```bash
npm run xsd:setup     # récupère les schémas officiels
npm run xsd:serve     # démarre le service (:8084)
# puis côté app : XSD_SERVICE_URL=http://localhost:8084
```
