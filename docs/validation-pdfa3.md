# Validation PDF/A-3 du conteneur Factur-X

> Trou QA « PDF/A-3 complète hors moteur ». Ce document explique ce que FactuCheck
> vérifie en interne, ce qui est délégué, et la preuve apportée par veraPDF.

## Deux niveaux de conformité, indépendants

Un fichier Factur-X est un **PDF/A-3** (le conteneur) qui embarque un **XML** de
facture. Deux conformités distinctes coexistent :

1. **Conformité PDF/A-3** (ISO 19005-3) : structure du conteneur — version PDF/A,
   métadonnées XMP, fichier embarqué déclaré, (output intent, polices…).
2. **Conformité Factur-X / EN 16931** : le XML respecte la sémantique ; le fichier
   embarqué se nomme `factur-x.xml` ; le profil est cohérent, etc.

Les deux sont indépendantes : un PDF peut être PDF/A-3 valide **et** mal nommé pour
Factur-X (c'est exactement notre fixture `KO_FACTURX_FC-S03_nom.pdf`).

## Ce que le moteur vérifie en interne (par requête)

`src/lib/engine/formats/pdf.ts` lit, sans dépendance native :
- `%PDF`, `pdfaid:part=3` (PDF-001 / FC-S02), XML embarqué présent (PDF-002),
  nom `factur-x.xml` (PDF-003 / FC-S03), cohérence XMP/XML du profil (PDF-004),
  version Factur-X (FMT-004).

C'est un contrôle de **marqueurs**, pas une validation ISO 19005-3 complète (profil
ICC, output intent, incorporation des polices, flux…). PDF-001 et FMT-005 portent
donc `exhaustif:false` → le rapport affiche **« Contrôle partiel »**.

## Ce qui est délégué à veraPDF (branché)

La validation PDF/A-3 **complète** est confiée à **veraPDF**, l'implémentation de
référence de la PDF Association (ISO 19005), via un **microservice** (Java) appelé
en HTTP — on ne l'embarque pas dans l'app serverless JS.

Le branchement est en place :
- **Microservice** : `services/verapdf/` (serveur `server.mjs` + `Dockerfile`).
  `POST /validate?flavour=3b` ← octets PDF → verdict JSON.
- **Client** : `src/lib/engine/verapdf-service.ts` (`validerPdfA3`), configuré par
  la variable d'environnement `VERAPDF_SERVICE_URL`.
- **Intégration** : `analyserFichierComplet` appelle le service pour tout PDF, en
  parallèle du Schematron, et **surcharge la règle PDF-001 (FC-S02)** avec le
  verdict réel :
  - conforme → PDF-001 **réussi** (le contrôle PDF/A-3 cesse d'être « partiel ») ;
  - non conforme → PDF-001 **bloquant**, avec les clauses ISO 19005-3 en échec.
- **Dégradation gracieuse** : si `VERAPDF_SERVICE_URL` est absent ou le service
  injoignable, `execute=false`, le moteur retombe sur le contrôle de marqueurs et
  le rapport reste « Contrôle partiel ». Aucune exception n'est levée.

## Preuve apportée

Nos fixtures Factur-X sont de **vrais PDF/A-3B**, pas des approximations :

```
veraPDF 1.30.4 — flavour 3b
  OK_FACTURX_conforme.pdf   → PASS  (192 contrôles, 0 échec, isCompliant=true)
  KO_FACTURX_FC-S03_nom.pdf → PASS  (PDF/A-3B valide ; échoue seulement la règle
                                      Factur-X FC-S03 côté moteur, nom ≠ factur-x.xml)
```

Le test `src/lib/engine/verapdf.pdfa.test.ts` rejoue cette validation ; il s'ignore
si `VERAPDF_CLI` n'est pas défini (CI sans Java).

## Rejouer

```bash
npm run verapdf:setup   # installe veraPDF en local (.verapdf/, non versionné)
npm run verapdf:run     # valide les fixtures PDF/A-3B
```

## État et limite restante

Le service veraPDF est **câblé** (client + microservice + intégration + tests). En
production, il suffit de déployer le conteneur `services/verapdf/` et de définir
`VERAPDF_SERVICE_URL` pour que la conformité PDF/A-3 soit réellement validée
par-upload (PDF-001 devient un contrôle exhaustif).

Même alors, le rapport peut rester « Contrôle partiel » tant que la validation
**XSD** (FC-S06 / FMT-005) n'est pas, elle aussi, branchée — c'est le dernier
maillon de validation structurelle, et il est affiché honnêtement.
