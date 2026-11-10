// Prépare le moteur de référence pour le test différentiel (Saxon) :
//   - télécharge Saxon-HE + xmlresolver + le squelette ISO Schematron ;
//   - récupère les schematrons officiels BRUTS (EN 16931 CII, FNFE-MPE CII) ;
//   - les compile en XSLT de validation (pipeline ISO : include → abstract → svrl).
// Résultat dans .saxon/ (non versionné). Lancer ensuite :
//   SAXON_DIR=.saxon DIFF_CORPUS=fixtures-corpus npx vitest run differential.saxon
//
// Usage : node scripts/diff-saxon.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), ".saxon");
const SRC = path.join(DIR, "src");
fs.mkdirSync(SRC, { recursive: true });

const SAXON_VER = "12.5";
const XMLRES_VER = "5.2.2";
const MVN = "https://repo1.maven.org/maven2";
const SKEL = "https://raw.githubusercontent.com/Schematron/schematron/master/trunk/schematron/code";
const EN16931 = "https://raw.githubusercontent.com/ConnectingEurope/eInvoicing-EN16931/master";
const FNFE = "https://raw.githubusercontent.com/fnfempe/France_RFE/main";

function curl(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return;
  execFileSync("curl", ["-sSfL", "--max-time", "120", "-o", dest, url]);
}
function saxon(args) {
  execFileSync(
    "java",
    ["-cp", `${DIR}/saxon.jar:${DIR}/xmlresolver.jar`, "net.sf.saxon.Transform", ...args],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
}
function fetchRec(base, rel, root) {
  const dest = path.join(root, rel);
  curl(`${base}/${rel}`, dest);
  const content = fs.readFileSync(dest, "utf8");
  const dir = path.posix.dirname(rel);
  for (const m of content.matchAll(/<include\s+href="([^"]+)"\s*\/>/g))
    fetchRec(base, path.posix.normalize(path.posix.join(dir, m[1])), root);
}

console.log("• Saxon-HE + xmlresolver + squelette ISO…");
curl(`${MVN}/net/sf/saxon/Saxon-HE/${SAXON_VER}/Saxon-HE-${SAXON_VER}.jar`, `${DIR}/saxon.jar`);
curl(`${MVN}/org/xmlresolver/xmlresolver/${XMLRES_VER}/xmlresolver-${XMLRES_VER}.jar`, `${DIR}/xmlresolver.jar`);
for (const f of ["iso_dsdl_include.xsl", "iso_abstract_expand.xsl", "iso_svrl_for_xslt2.xsl"])
  curl(`${SKEL}/${f}`, `${DIR}/${f}`);

function compile(nom, schPath) {
  console.log(`• Compilation ${nom}…`);
  const t1 = `${DIR}/${nom}.1.sch`, t2 = `${DIR}/${nom}.2.sch`, out = `${DIR}/${nom}-validation.xsl`;
  saxon([`-s:${schPath}`, `-xsl:${DIR}/iso_dsdl_include.xsl`, `-o:${t1}`]);
  saxon([`-s:${t1}`, `-xsl:${DIR}/iso_abstract_expand.xsl`, `-o:${t2}`]);
  saxon([`-s:${t2}`, `-xsl:${DIR}/iso_svrl_for_xslt2.xsl`, `-o:${out}`]);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}

console.log("• Schematrons officiels (bruts)…");
// CII
fetchRec(EN16931, "cii/schematron/EN16931-CII-validation.sch", `${SRC}/en16931`);
curl(`${FNFE}/FNFE_RFE_INVOICE/CII/EXTENDED-CTC-FR/schematron/BR-FR-Flux2-Schematron-CII.sch`, `${SRC}/fnfe-cii.sch`);
// UBL
fetchRec(EN16931, "ubl/schematron/EN16931-UBL-validation.sch", `${SRC}/en16931`);
curl(`${FNFE}/FNFE_RFE_INVOICE/UBL/EXTENDED-CTC-FR/schematron/BR-FR-Flux2-Schematron-UBL.sch`, `${SRC}/fnfe-ubl.sch`);

compile("en16931-cii", `${SRC}/en16931/cii/schematron/EN16931-CII-validation.sch`);
compile("fnfe-cii", `${SRC}/fnfe-cii.sch`);
compile("en16931-ubl", `${SRC}/en16931/ubl/schematron/EN16931-UBL-validation.sch`);
compile("fnfe-ubl", `${SRC}/fnfe-ubl.sch`);

console.log(
  "\nTerminé. Lancer le test différentiel :\n  SAXON_DIR=.saxon DIFF_CORPUS=fixtures-corpus npx vitest run differential.saxon",
);
