// Microservice de validation XSD (structure/syntaxe) des factures CII et UBL.
// S'appuie sur xmllint (libxml2). Sans dépendance npm.
//
//   GET  /health                   → 200 { ok: true }
//   POST /validate?format=CII|UBL  (corps = XML)  → { valid, format, errors:[{line,message}] }
//
// Config (variables d'environnement) :
//   SCHEMAS_DIR   dossier des schémas (défaut: ./schemas, voir scripts/fetch-xsd.mjs)
//   XMLLINT       binaire xmllint (défaut: "xmllint")
//   PORT          port d'écoute (défaut: 8084)
//   MAX_BYTES     taille max du XML (défaut: 15 Mo)
//
// L'app FactuCheck l'appelle via src/lib/engine/xsd-service.ts.
import http from "node:http";
import { execFile } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const XMLLINT = process.env.XMLLINT || "xmllint";
const SCHEMAS_DIR = process.env.SCHEMAS_DIR || path.join(process.cwd(), "schemas");
const PORT = Number(process.env.PORT || 8084);
const MAX_BYTES = Number(process.env.MAX_BYTES || 15 * 1024 * 1024);

// Point d'entrée XSD par format (CII = profil Factur-X EN 16931).
const ENTREE = {
  CII: path.join(SCHEMAS_DIR, "cii", "Factur-X_EN16931.xsd"),
  FACTURX_PDF: path.join(SCHEMAS_DIR, "cii", "Factur-X_EN16931.xsd"),
  UBL: path.join(SCHEMAS_DIR, "ubl", "maindoc", "UBL-Invoice-2.1.xsd"),
};

/** Extrait les erreurs de validation de la sortie xmllint (stderr). */
function parseErreurs(stderr) {
  const errors = [];
  for (const ligne of stderr.split(/\r?\n/)) {
    const m = ligne.match(/:(\d+):.*?(?:validity error|error)\s*:\s*(.*)$/i);
    if (m) errors.push({ line: Number(m[1]), message: m[2].trim().slice(0, 300) });
    if (errors.length >= 50) break;
  }
  return errors;
}

function valider(xmlPath, schema) {
  return new Promise((resolve, reject) => {
    execFile(
      XMLLINT,
      // --nonet : interdit tout accès réseau (pas de récupération de DTD/schéma
      // distant référencé par un XML hostile). Sans --noent ni --loaddtd : les
      // entités externes et DTD ne sont de toute façon pas chargées.
      ["--nonet", "--noout", "--schema", schema, xmlPath],
      { maxBuffer: 32 * 1024 * 1024 },
      (err, _stdout, stderr) => {
        // xmllint : code 0 = valide ; code 3/4 = non valide (pas une panne service).
        if (!err) return resolve({ valid: true, errors: [] });
        if (err.code === 3 || err.code === 4) return resolve({ valid: false, errors: parseErreurs(stderr) });
        reject(new Error(stderr?.split("\n")[0] || err.message));
      },
    );
  });
}

const server = http.createServer((req, res) => {
  const envoyer = (code, obj) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(obj));
  };
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/health") return envoyer(200, { ok: true });
  if (req.method !== "POST" || url.pathname !== "/validate") return envoyer(404, { error: "not found" });

  const format = (url.searchParams.get("format") || "CII").toUpperCase();
  const schema = ENTREE[format];
  if (!schema) return envoyer(400, { error: `format non supporté: ${format}` });
  if (!existsSync(schema)) return envoyer(503, { error: `schéma absent pour ${format} (lancer fetch-xsd)` });

  const chunks = [];
  let taille = 0;
  req.on("data", (c) => {
    taille += c.length;
    if (taille > MAX_BYTES) {
      envoyer(413, { error: "XML trop volumineux" });
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on("end", async () => {
    if (!chunks.length) return envoyer(400, { error: "corps vide" });
    const dir = mkdtempSync(path.join(os.tmpdir(), "xsd-"));
    const xml = path.join(dir, "invoice.xml");
    try {
      writeFileSync(xml, Buffer.concat(chunks));
      const r = await valider(xml, schema);
      envoyer(200, { format, ...r });
    } catch (e) {
      envoyer(502, { error: `xmllint: ${e.message}` });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

server.listen(PORT, () => console.log(`xsd-service à l'écoute sur :${PORT} (schemas: ${SCHEMAS_DIR})`));
