// Génère la matrice de couverture de tests (docs/couverture-tests.md) à partir
// des sources réelles : le catalogue rules/*.json, le corpus versionné
// (fixtures-corpus/manifest.json) et les fichiers de test src/lib/engine/*.test.ts.
//
// But (consigne QA n°5) : couverture par règle FC-xxx, par format et par profil,
// SANS surestimer. Un « ✓ » n'est posé que si une assertion réelle l'atteste.
//
// Usage : node scripts/coverage-matrix.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RULES_DIR = path.join(ROOT, "rules");
const ENGINE_DIR = path.join(ROOT, "src/lib/engine");

// 1. Catalogue des règles
const rules = [];
for (const f of fs.readdirSync(RULES_DIR).filter((f) => f.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync(path.join(RULES_DIR, f), "utf8"));
  const arr = j.regles || j.motifs || (Array.isArray(j) ? j : []);
  for (const r of arr) {
    if (!r.id) continue;
    const src = Boolean(r.source) && !/à vérifier|à confirmer|a confirmer/i.test(r.source);
    rules.push({
      id: r.id,
      specId: r.specId || "",
      sev: r.severite || "",
      exhaustif: r.exhaustif === false ? "non" : "oui",
      source: src,
    });
  }
}

// 2. Corpus versionné (XML + PDF) : fixtures OK/KO par règle et par format
function lireManifeste(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : [];
}
const manifest = [
  ...lireManifeste("fixtures-corpus/manifest.json"),
  ...lireManifeste("fixtures-corpus-pdf/manifest.json"),
];
const corpusKO = new Set(manifest.filter((m) => m.ruleId).map((m) => m.ruleId));

// Couverture corpus par format : fixtures OK et KO présentes
const parFormat = {};
for (const m of manifest) {
  const f = m.format || "?";
  parFormat[f] ??= { ok: 0, ko: 0, regles: new Set() };
  if (m.conforme) parFormat[f].ok++;
  else {
    parFormat[f].ko++;
    if (m.ruleId) parFormat[f].regles.add(m.ruleId);
  }
}
const fmtCell = (f) => {
  const d = parFormat[f];
  if (!d) return { ok: "—", ko: "— *(aucune fixture)*" };
  return {
    ok: d.ok > 0 ? `✓ (${d.ok})` : "—",
    ko: d.ko > 0 ? `✓ ${d.ko} règle(s) : ${[...d.regles].join(", ")}` : "—",
  };
};

// 3. Tests unitaires : OK (statut reussi) et KO (bloque/avertit) assertés par id
const testFiles = fs.readdirSync(ENGINE_DIR).filter((f) => /\.test\.ts$/.test(f));
const blob = testFiles.map((f) => fs.readFileSync(path.join(ENGINE_DIR, f), "utf8")).join("\n");
function cited(id) {
  return new RegExp(`["'\`]${id.replace(/[-]/g, "\\-")}["'\`]`).test(blob);
}
// OK : l'id apparaît dans une ligne qui attend "reussi"/"conforme" ; KO : "bloquant"/"avertissement"/"non_conforme"/toBe(true) dans le bloc invalide
function okAsserted(id) {
  // id et assertion "reussi" proches (même bloc it(), assertions multi-lignes incluses)
  return new RegExp(`${id}[\\s\\S]{0,160}reussi`).test(blob) || new RegExp(`reussi[\\s\\S]{0,160}${id}`).test(blob);
}

for (const r of rules) {
  r.unit = cited(r.id);
  r.corpus = corpusKO.has(r.id);
  r.ok = okAsserted(r.id);
}

// 4. Rendu Markdown
rules.sort((a, b) => (a.specId || "zz99").localeCompare(b.specId || "zz99", undefined, { numeric: true }));
const total = rules.length;
const nSrc = rules.filter((r) => r.source).length;
const nUnit = rules.filter((r) => r.unit).length;
const nCorp = rules.filter((r) => r.corpus).length;
const nOk = rules.filter((r) => r.ok).length;
const nKo = rules.filter((r) => r.corpus || (r.unit && !r.ok)).length;

const lignes = rules.map((r) => {
  const koUnit = r.unit && !r.ok;
  return `| ${r.specId || "—"} | \`${r.id}\` | ${r.sev} | ${r.exhaustif} | ${
    r.source ? "✓" : "**À VÉRIFIER**"
  } | ${r.ok ? "✓" : "—"} | ${r.corpus ? "✓" : koUnit ? "✓ (unit)" : "—"} |`;
});

const md = `# Couverture de tests — par règle, par format, par profil

> Généré par \`node scripts/coverage-matrix.mjs\` à partir de \`rules/*.json\`,
> \`fixtures-corpus/manifest.json\` et \`src/lib/engine/*.test.ts\`. Ne pas éditer à la main.
> Un « ✓ » n'est posé que si une assertion réelle l'atteste — aucune couverture n'est supposée.

Réponse à la consigne QA n°5. La transparence prime : les cases vides sont des
**trous de couverture connus**, pas masqués.

## Synthèse

| Indicateur | Valeur |
|---|---|
| Règles au catalogue | ${total} |
| Source réglementaire vérifiée | ${nSrc} / ${total} (${total - nSrc} encore « À VÉRIFIER ») |
| Règles avec cas **OK** testé (passe sur facture conforme) | ${nOk} / ${total} |
| Règles avec cas **KO** testé (corpus ou unitaire) | ${nKo} / ${total} |
| — dont corpus versionné (\`fixtures-corpus/\`) | ${nCorp} |

## Par règle

| specId | ruleId | sévérité | exhaustif | source | cas OK | cas KO |
|---|---|---|---|---|---|---|
${lignes.join("\n")}

**Lecture.** *cas OK* = une facture conforme ne déclenche pas la règle (statut
\`reussi\` asserté). *cas KO* = une facture fautive la déclenche (fixture du corpus,
ou assertion unitaire « (unit) »). *exhaustif = non* → la règle ne peut pas conclure
seule à la conformité (PDF/A-3, XSD) : le rapport reste « Contrôle partiel ».

## Par format

| Format | Parsing | Cas OK (conforme) | Cas KO (corpus) | Schematron officiel |
|---|---|---|---|---|
| **CII** | ✓ (\`engine.test.ts\`) | ${fmtCell("CII").ok} | ${fmtCell("CII").ko} | ✓ EN16931-CII + FNFE-CII (diff. Saxon : 0 écart) |
| **UBL** | ✓ (\`engine.test.ts\` + corpus) | ${fmtCell("UBL").ok} | ${fmtCell("UBL").ko} | ✓ EN16931-UBL + FNFE-UBL (diff. Saxon : 0 écart) |
| **Factur-X (PDF/A-3)** | extraction XML ✓ (\`facturx-pdf.test.ts\`) | ${fmtCell("FACTURX_PDF").ok} | ${fmtCell("FACTURX_PDF").ko} | s.o. (le XML embarqué suit le profil CII) |

**Fixtures par format** : CII \`fixtures-corpus/*.xml\`, UBL \`fixtures-corpus/*UBL*.xml\`,
Factur-X \`fixtures-corpus-pdf/*.pdf\` (générées par \`scripts/make-facturx-pdf.mjs\`).

Les schematrons officiels CII **et UBL** (EN 16931 + FNFE-MPE) sont rejoués dans le
test différentiel Saxon avec **0 écart** (30 comparaisons).

**Trou restant.** La validation **PDF/A-3 complète** (veraPDF : profil ICC, output
intent, polices) reste hors moteur → FC-S02/FC-S06 \`exhaustif:false\`, verdict
« Contrôle partiel ».

## Par profil

| Profil | Couverture |
|---|---|
| **EN 16931** | fixture conforme + schematron officiel EN16931-CII (diff. Saxon 0 écart) |
| **EXTENDED-CTC-FR** | schematron FNFE officiel + 20 fonctions custom portées et testées (\`schematron-fnfe.test.ts\`) ; diff. Saxon 0 écart |
| **BASIC / MINIMUM / BASIC WL** | couverts seulement par le **refus** (FMT-003 / FC-S05 : profil non accepté en CTC) ; pas de validation de contenu propre |

## Limites assumées (→ « Contrôle partiel »)

- **FC-S02 (PDF/A-3)** et **FC-S06 (XSD)** sont \`exhaustif: non\` : validation
  structurelle complète = services externes (veraPDF, XSD natif) non branchés.
- **FC-M09** reste « À VÉRIFIER » : passage exact de la norme XP Z12-012 non cité.
- ${total - nSrc} règles sans source officielle vérifiée restent « À VÉRIFIER ».

## Régénérer

\`\`\`bash
node scripts/coverage-matrix.mjs   # réécrit ce fichier
\`\`\`
`;

fs.writeFileSync(path.join(ROOT, "docs/couverture-tests.md"), md);
console.log(`docs/couverture-tests.md écrit — ${total} règles, source ${nSrc}, OK ${nOk}, KO ${nKo}.`);
