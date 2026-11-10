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
const BASE = `https://raw.githubusercontent.com/ConnectingEurope/eInvoicing-EN16931/${REF}`;
const OUT = path.join(process.cwd(), "schematron", "official");

const TARGETS = [
  { flavor: "cii", main: "cii/schematron/EN16931-CII-validation.sch" },
  { flavor: "ubl", main: "ubl/schematron/EN16931-UBL-validation.sch" },
];

function curl(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  // curl est préconfiguré pour le proxy sortant de l'environnement.
  execFileSync("curl", ["-sSfL", "--max-time", "60", "-o", dest, url]);
}

function fetchRecursive(repoRelPath, tmpRoot, seen = new Set()) {
  if (seen.has(repoRelPath)) return;
  seen.add(repoRelPath);
  const dest = path.join(tmpRoot, repoRelPath);
  curl(`${BASE}/${repoRelPath}`, dest);
  const content = fs.readFileSync(dest, "utf8");
  const dir = path.posix.dirname(repoRelPath);
  for (const m of content.matchAll(/<include\s+href="([^"]+)"\s*\/>/g)) {
    fetchRecursive(path.posix.normalize(path.posix.join(dir, m[1])), tmpRoot, seen);
  }
}

fs.mkdirSync(OUT, { recursive: true });
for (const t of TARGETS) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `en16931-${t.flavor}-`));
  process.stdout.write(`• ${t.flavor.toUpperCase()} : téléchargement (${REF})… `);
  fetchRecursive(t.main, tmp);
  const out = preprocess(path.join(tmp, t.main));
  fs.writeFileSync(path.join(OUT, `${t.flavor}.sch`), out, "utf8");
  console.log(`préprocessé → schematron/official/${t.flavor}.sch (${out.length} octets)`);
}
console.log("Terminé. Redémarrez l'application pour utiliser les schematrons officiels.");
