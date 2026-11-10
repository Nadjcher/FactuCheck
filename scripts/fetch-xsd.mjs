// Récupère les XSD officiels pour la validation structurelle, dans
// services/xsd/schemas/ (non versionné : licences tierces UN/CEFACT / OASIS).
//   - UBL 2.1  : OASIS (os-UBL-2.1), récupération récursive des imports.
//   - CII      : profil Factur-X EN 16931 (v1.09), extrait du paquet PyPI
//                « factur-x » (qui redistribue les XSD UN/CEFACT).
//
// Utilisé au build du microservice (services/xsd/Dockerfile) et en local.
// Usage : node scripts/fetch-xsd.mjs
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const OUT = path.join(process.cwd(), "services", "xsd", "schemas");
const UBL = path.join(OUT, "ubl");
const CII = path.join(OUT, "cii");

function curl(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return;
  execFileSync("curl", ["-sSfL", "--max-time", "120", "-o", dest, url]);
}

// --- UBL 2.1 (OASIS) : récursif sur schemaLocation ------------------------
const UBL_BASE = "https://docs.oasis-open.org/ubl/os-UBL-2.1/xsd";
const vus = new Set();
function fetchUbl(rel) {
  rel = path.posix.normalize(rel);
  if (vus.has(rel)) return;
  vus.add(rel);
  const dest = path.join(UBL, rel);
  curl(`${UBL_BASE}/${rel}`, dest);
  const c = fs.readFileSync(dest, "utf8");
  const dir = path.posix.dirname(rel);
  for (const m of c.matchAll(/schemaLocation="([^"]+)"/g)) {
    if (/^https?:/.test(m[1])) continue;
    fetchUbl(path.posix.join(dir, m[1]));
  }
}

// --- CII Factur-X EN 16931 (paquet PyPI factur-x, redistribue UN/CEFACT) ---
const WHEEL_URL =
  "https://files.pythonhosted.org/packages/5e/a7/c91990338e6cbc2461f1353a369e69f9d5469e466ceb02f1d8d962605f13/factur_x-7.9-py3-none-any.whl";
const WHEEL_SHA256 = "a91b66e48b51de0b2075d52091e794ed254585553daa5bfbd37041a166e296ae";
const CII_PROFILE_DIR = "facturx/xsd_and_schematron/facturx-en16931";

function fetchCii() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fx-wheel-"));
  const whl = path.join(tmp, "factur-x.whl");
  execFileSync("curl", ["-sSfL", "--max-time", "180", "-o", whl, WHEEL_URL]);
  const sum = createHash("sha256").update(fs.readFileSync(whl)).digest("hex");
  if (sum !== WHEEL_SHA256) throw new Error(`Empreinte du wheel factur-x inattendue : ${sum}`);
  // Le wheel est un zip : on extrait le dossier du profil EN 16931.
  execFileSync("unzip", ["-o", "-q", whl, `${CII_PROFILE_DIR}/*`, "-d", tmp]);
  fs.mkdirSync(CII, { recursive: true });
  const src = path.join(tmp, CII_PROFILE_DIR);
  for (const f of fs.readdirSync(src).filter((f) => f.endsWith(".xsd"))) {
    fs.copyFileSync(path.join(src, f), path.join(CII, f));
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("• UBL 2.1 (OASIS)…");
fetchUbl("maindoc/UBL-Invoice-2.1.xsd");
console.log(`  → ${vus.size} fichiers dans ${path.relative(process.cwd(), UBL)}`);

console.log("• CII Factur-X EN 16931 (PyPI factur-x)…");
fetchCii();
console.log(`  → ${fs.readdirSync(CII).length} fichiers dans ${path.relative(process.cwd(), CII)}`);

console.log("\nPoints d'entrée :");
console.log(`  UBL : services/xsd/schemas/ubl/maindoc/UBL-Invoice-2.1.xsd`);
console.log(`  CII : services/xsd/schemas/cii/Factur-X_EN16931.xsd`);
