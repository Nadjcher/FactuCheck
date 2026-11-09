# Catalogue de règles de contrôle — `rules/*.json`

> **C'est le cœur de valeur de FactuCheck, et la zone à ne JAMAIS remplir à l'aveugle.**

Chaque règle décrite ici est **déclarative** : elle porte un identifiant, un
libellé, une sévérité, une catégorie, un message, un conseil « comment corriger »
et une **source**. L'implémentation technique de chaque contrôle (la fonction qui
dit « réussi / avertissement / bloquant ») vit dans
`src/lib/engine/checks.ts`, associée à la règle par son `id`.

## Règle d'or

**Aucune règle n'est réputée fiable tant que son champ `source` n'est pas
renseigné depuis une spécification officielle et que `aVerifier` n'est pas passé
à `false`.**

Dans l'interface, toute règle avec `aVerifier: true` est affichée avec un badge
**« À VÉRIFIER »** : son verdict est indicatif et ne doit pas être présenté au
client final comme une certitude réglementaire.

## Sources officielles à utiliser pour renseigner `source`

| Source | Usage |
|---|---|
| **EN 16931** | Norme sémantique européenne de la facture électronique (règles BR-xx, BR-CO-xx). |
| **Spécifications Factur-X — FNFE-MPE** | Profils (MINIMUM, BASIC WL, BASIC, EN 16931, EXTENDED), structure PDF/A-3 + XML `factur-x.xml`. |
| **DGFiP** | Modalités françaises (mentions obligatoires, e-reporting, plateformes agréées). |
| **ISO 19005-3 (PDF/A-3)** | Conformité du conteneur PDF. |

Renseignez `source` avec une référence précise et traçable, par exemple :
`"EN 16931 — BR-CO-15"` ou
`"Factur-X 1.0.07 (FNFE-MPE) — §2.3, PDF/A-3"`.

## Format d'une règle

```json
{
  "id": "MNT-001",
  "libelle": "Cohérence HT + TVA = TTC",
  "categorie": "montants",
  "severite": "bloquant",
  "source": null,
  "aVerifier": true,
  "messageOk": "Les montants sont cohérents.",
  "commentCorriger": "Vérifiez que Total TTC = Total HT + Total TVA...",
  "infobulle": "HT : montant hors taxe. TTC : toutes taxes comprises."
}
```

- `severite` : statut attribué **quand la règle échoue** (`bloquant` ou `avertissement`).
  Une règle qui passe vaut toujours `reussi`.
- `source` : `null` tant que non vérifiée.
- `aVerifier` : `true` tant que la source n'est pas confirmée.
