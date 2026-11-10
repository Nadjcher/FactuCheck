// Préprocesseur Schematron : résout les <include> et développe les patterns
// abstraits (is-a + param), pour produire un .sch autonome exécutable par
// node-schematron (qui ne fait ni l'un ni l'autre).
//
// Équivaut, pour l'essentiel, à iso_dsdl_include + iso_abstract_expand.
//
// Usage CLI : node scripts/preprocess-schematron.mjs <main.sch> <out.sch>
// Ou importé  : import { preprocess } from "./preprocess-schematron.mjs"
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";

const paramParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (n) => n === "param",
});

function encode(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Résout récursivement les <include href="..."/> (relatifs au fichier). */
function inlineIncludes(text, baseDir) {
  return text.replace(/<include\s+href="([^"]+)"\s*\/>/g, (_m, href) => {
    const p = path.join(baseDir, href);
    const content = fs.readFileSync(p, "utf8");
    const s = content.indexOf("<pattern");
    const e = content.lastIndexOf("</pattern>");
    if (s < 0 || e < 0) throw new Error(`Aucun <pattern> dans ${href}`);
    return inlineIncludes(content.slice(s, e + "</pattern>".length), path.dirname(p));
  });
}

/** Préprocesse un schematron et renvoie le .sch autonome (string). */
export function preprocess(mainPath) {
  let doc = fs.readFileSync(mainPath, "utf8");
  doc = inlineIncludes(doc, path.dirname(mainPath));

  const abstraits = new Map(); // id -> corps
  const PATTERN = /<pattern\b([^>]*)>([\s\S]*?)<\/pattern>/g;

  const sortie = doc.replace(PATTERN, (match, attrs, corps) => {
    const estAbstrait = /\babstract\s*=\s*"true"/.test(attrs);
    const isA = attrs.match(/\bis-a\s*=\s*"([^"]+)"/);
    const id = attrs.match(/\bid\s*=\s*"([^"]+)"/);

    if (estAbstrait) {
      if (id) abstraits.set(id[1], corps);
      return "";
    }
    if (!isA) return match;

    const corpsAbstrait = abstraits.get(isA[1]);
    if (!corpsAbstrait) throw new Error(`Pattern abstrait introuvable : ${isA[1]}`);

    const frag = paramParser.parse(`<pattern>${corps}</pattern>`);
    const params = new Map();
    for (const p of frag.pattern?.param ?? []) {
      params.set(String(p["@_name"]), String(p["@_value"]));
    }
    // Substitue les variables de PARAMÈTRE ($BR-xx…) ; laisse les variables
    // XPath liées (every $x in … satisfies …, let $x := …) intactes.
    const developpe = corpsAbstrait.replace(/\$([A-Za-z_][\w.-]*)/g, (whole, nom) =>
      params.has(nom) ? encode(params.get(nom)) : whole,
    );
    return `<pattern${id ? ` id="${id[1]}"` : ""}>${developpe}</pattern>`;
  });

  return sortie;
}

// --- CLI -------------------------------------------------------------------
const estCLI = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (estCLI) {
  const [, , mainPath, outPath] = process.argv;
  if (!mainPath || !outPath) {
    console.error("Usage: node scripts/preprocess-schematron.mjs <main.sch> <out.sch>");
    process.exit(2);
  }
  const out = preprocess(mainPath);
  fs.writeFileSync(outPath, out, "utf8");
  console.log(`OK → ${outPath} (${out.length} octets)`);
}
