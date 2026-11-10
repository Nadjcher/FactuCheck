// Microservice de validation PDF/A-3 (veraPDF). Sans dépendance externe.
//
// Expose :
//   GET  /health            → 200 { ok: true }
//   POST /validate?flavour=3b  (corps = octets PDF)
//        → 200 { compliant, flavour, passedChecks, failedChecks, failures:[{clause,message}] }
//
// Config (variables d'environnement) :
//   VERAPDF_CLI  chemin du binaire veraPDF (défaut: "verapdf" dans le PATH)
//   PORT         port d'écoute (défaut: 8083)
//   MAX_BYTES    taille max du PDF accepté (défaut: 25 Mo)
//
// L'app FactuCheck l'appelle via src/lib/engine/verapdf-service.ts.
import http from "node:http";
import { execFile } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const CLI = process.env.VERAPDF_CLI || "verapdf";
const PORT = Number(process.env.PORT || 8083);
const MAX_BYTES = Number(process.env.MAX_BYTES || 25 * 1024 * 1024);
const FLAVOURS = new Set(["1a", "1b", "2a", "2b", "2u", "3a", "3b", "3u"]);

/** Extrait le verdict d'un rapport XML veraPDF (sans dépendance XML). */
function parseRapport(xml) {
  const compliant = /isCompliant="true"/.test(xml);
  // Les totaux sont portés par <validationReport>/<details> (premières occurrences).
  const passedChecks = Number(xml.match(/passedChecks="(\d+)"/)?.[1] ?? 0);
  const failedChecks = Number(xml.match(/failedChecks="(\d+)"/)?.[1] ?? 0);
  const failures = [];
  const ruleRe = /<rule\b[^>]*\bclause="([^"]*)"[^>]*status="failed"[^>]*>([\s\S]*?)<\/rule>/g;
  let m;
  while ((m = ruleRe.exec(xml)) && failures.length < 20) {
    const clause = m[1];
    const desc = m[2].match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() ?? "";
    failures.push({ clause, message: desc.replace(/\s+/g, " ").slice(0, 300) });
  }
  return { compliant, passedChecks, failedChecks, failures };
}

function valider(pdfPath, flavour) {
  return new Promise((resolve, reject) => {
    execFile(
      CLI,
      ["--flavour", flavour, "--format", "xml", pdfPath],
      { maxBuffer: 64 * 1024 * 1024 },
      // veraPDF renvoie un code de sortie non nul quand le PDF n'est pas conforme :
      // ce n'est PAS une erreur du service, on parse quand même la sortie.
      (err, stdout) => {
        if (stdout && /<report/.test(stdout)) return resolve(parseRapport(stdout));
        if (err) return reject(err);
        resolve(parseRapport(stdout || ""));
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

  const flavour = url.searchParams.get("flavour") || "3b";
  if (!FLAVOURS.has(flavour)) return envoyer(400, { error: `flavour invalide: ${flavour}` });

  const chunks = [];
  let taille = 0;
  req.on("data", (c) => {
    taille += c.length;
    if (taille > MAX_BYTES) {
      envoyer(413, { error: "PDF trop volumineux" });
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on("end", async () => {
    if (!chunks.length) return envoyer(400, { error: "corps vide" });
    const dir = mkdtempSync(path.join(os.tmpdir(), "verapdf-"));
    const pdf = path.join(dir, "invoice.pdf");
    try {
      writeFileSync(pdf, Buffer.concat(chunks));
      const r = await valider(pdf, flavour);
      envoyer(200, { flavour, ...r });
    } catch (e) {
      envoyer(502, { error: `veraPDF: ${e.message}` });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

server.listen(PORT, () => console.log(`verapdf-service à l'écoute sur :${PORT} (CLI: ${CLI})`));
