// Installe veraPDF (validateur PDF/A de référence, ISO 19005) en local, headless,
// dans .verapdf/ (non versionné). Sert au test de validation PDF/A-3 des fixtures
// Factur-X (src/lib/engine/verapdf.pdfa.test.ts).
//
// veraPDF est l'implémentation de référence de la validation PDF/A (projet soutenu
// par la PDF Association). On ne l'embarque pas dans l'app (serverless JS) : en
// production, la validation PDF/A-3 complète est déléguée à un service veraPDF.
// Ce script permet de la REJOUER en dev/CI sur nos fixtures.
//
// Usage : node scripts/verapdf-setup.mjs
//   puis : VERAPDF_CLI=.verapdf/verapdf npx vitest run verapdf.pdfa
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), ".verapdf");
const INSTALL = path.join(DIR, "app");
const CLI = path.join(INSTALL, "verapdf");
if (fs.existsSync(CLI)) {
  console.log(`veraPDF déjà installé : ${path.relative(process.cwd(), CLI)}`);
  process.exit(0);
}
fs.mkdirSync(DIR, { recursive: true });

const URL = "https://software.verapdf.org/releases/verapdf-installer.zip";
const zip = path.join(DIR, "installer.zip");
console.log("• Téléchargement de veraPDF…");
execFileSync("curl", ["-sSfL", "--max-time", "240", "-o", zip, URL]);
execFileSync("unzip", ["-o", "-q", zip, "-d", DIR]);

const sub = fs.readdirSync(DIR).find((d) => d.startsWith("verapdf-greenfield-"));
if (!sub) throw new Error("Installeur veraPDF introuvable après décompression.");
const jar = fs
  .readdirSync(path.join(DIR, sub))
  .find((f) => f.startsWith("verapdf-izpack-installer") && f.endsWith(".jar"));
if (!jar) throw new Error("Jar d'installation veraPDF introuvable.");

const auto = path.join(DIR, "auto.xml");
fs.writeFileSync(
  auto,
  `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<AutomatedInstallation langpack="eng">
  <com.izforge.izpack.panels.htmlhello.HTMLHelloPanel id="welcome"/>
  <com.izforge.izpack.panels.target.TargetPanel id="install_dir">
    <installpath>${INSTALL}</installpath>
  </com.izforge.izpack.panels.target.TargetPanel>
  <com.izforge.izpack.panels.packs.PacksPanel id="sdk_pack_select">
    <pack index="0" name="veraPDF Mac and *nix Scripts" selected="true"/>
    <pack index="1" name="veraPDF GUI" selected="true"/>
    <pack index="2" name="veraPDF Validation model" selected="true"/>
    <pack index="3" name="veraPDF Documentation" selected="false"/>
    <pack index="4" name="veraPDF Sample Files" selected="false"/>
  </com.izforge.izpack.panels.packs.PacksPanel>
  <com.izforge.izpack.panels.install.InstallPanel id="install"/>
  <com.izforge.izpack.panels.finish.FinishPanel id="finish"/>
</AutomatedInstallation>
`,
);

console.log("• Installation headless…");
execFileSync("java", ["-jar", path.join(DIR, sub, jar), auto], { stdio: ["ignore", "ignore", "inherit"] });

if (!fs.existsSync(CLI)) throw new Error(`CLI veraPDF absent après installation : ${CLI}`);
console.log(`\nTerminé. Lancer la validation PDF/A-3 des fixtures :\n  VERAPDF_CLI=${path.relative(process.cwd(), CLI)} npx vitest run verapdf.pdfa`);
