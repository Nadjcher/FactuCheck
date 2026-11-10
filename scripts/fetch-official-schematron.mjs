// Récupère les schematrons officiels EN 16931 (CII + UBL) depuis le dépôt
// ConnectingEurope/eInvoicing-EN16931 (licence EUPL 1.2), les préprocesse
// (inline des includes + expansion des patterns abstraits) et les écrit dans
// schematron/official/{cii,ubl}.sch — prioritaires au runtime.
//
// Usage : node scripts/fetch-official-schematron.mjs [ref]
//   ref = branche ou tag du dépôt (défaut : master)
//
// Les fichiers produits NE sont PAS versionnés (voir .gitignore) : ils restent
// soumis à la licence EUPL de leur source.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { preprocess } from "./preprocess-schematron.mjs";

const REF = process.argv[2] || "master";
const EN16931 = `https://raw.githubusercontent.com/ConnectingEurope/eInvoicing-EN16931/${REF}`;
const FNFE = "https://raw.githubusercontent.com/fnfempe/France_RFE/main";
const OUT = path.join(process.cwd(), "schematron", "official");

const TARGETS = [
  // EN 16931 (sémantique européenne) — includes + patterns abstraits à développer.
  { out: "cii", base: EN16931, main: "cii/schematron/EN16931-CII-validation.sch" },
  { out: "ubl", base: EN16931, main: "ubl/schematron/EN16931-UBL-validation.sch" },
  // FNFE-MPE BR-FR (profil EXTENDED-CTC-FR) — autonome (strip <xsl:function> + <let>
  // sont faits au runtime par transformerSchematron).
  { out: "fnfe-cii", base: FNFE, main: "FNFE_RFE_INVOICE/CII/EXTENDED-CTC-FR/schematron/BR-FR-Flux2-Schematron-CII.sch" },
  { out: "fnfe-ubl", base: FNFE, main: "FNFE_RFE_INVOICE/UBL/EXTENDED-CTC-FR/schematron/BR-FR-Flux2-Schematron-UBL.sch" },
];

function curl(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  // curl est préconfiguré pour le proxy sortant de l'environnement.
  execFileSync("curl", ["-sSfL", "--max-time", "60", "-o", dest, url]);
}

function fetchRecursive(base, repoRelPath, tmpRoot, seen = new Set()) {
  if (seen.has(repoRelPath)) return;
  seen.add(repoRelPath);
  const dest = path.join(tmpRoot, repoRelPath);
  curl(`${base}/${repoRelPath}`, dest);
  const content = fs.readFileSync(dest, "utf8");
  const dir = path.posix.dirname(repoRelPath);
  for (const m of content.matchAll(/<include\s+href="([^"]+)"\s*\/>/g)) {
    fetchRecursive(base, path.posix.normalize(path.posix.join(dir, m[1])), tmpRoot, seen);
  }
}

fs.mkdirSync(OUT, { recursive: true });
for (const t of TARGETS) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `sch-${t.out}-`));
  process.stdout.write(`• ${t.out} : téléchargement… `);
  try {
    fetchRecursive(t.base, t.main, tmp);
    // preprocess() résout includes + patterns abstraits (EN 16931) ; sans objet
    // pour le FNFE (autonome) → renvoyé tel quel, transformé au runtime.
    const out = preprocess(path.join(tmp, t.main));
    fs.writeFileSync(path.join(OUT, `${t.out}.sch`), out, "utf8");
    console.log(`→ schematron/official/${t.out}.sch (${out.length} octets)`);
  } catch (e) {
    console.log(`ÉCHEC : ${e.message}`);
  }
}
console.log("Terminé. Redémarrez l'application pour utiliser les schematrons officiels.");
