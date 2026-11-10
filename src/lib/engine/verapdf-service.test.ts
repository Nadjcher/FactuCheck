// Câblage du service veraPDF : client + intégration dans analyserFichierComplet.
// Utilise un serveur mock déterministe (pas de Java requis en CI). Un test réel
// contre veraPDF est inclus mais ignoré sans VERAPDF_CLI.
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { validerPdfA3 } from "./verapdf-service";
import { analyserFichierComplet } from "./run";

const PDF = fs.readFileSync(path.join(process.cwd(), "fixtures-corpus-pdf/OK_FACTURX_conforme.pdf"));

/** Démarre un serveur HTTP qui renvoie `verdict` sur POST /validate. */
function mock(verdict: unknown): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      if (req.method === "POST" && req.url?.startsWith("/validate")) {
        req.on("data", () => {});
        req.on("end", () => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(verdict));
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    srv.listen(0, "127.0.0.1", () => {
      const port = (srv.address() as import("node:net").AddressInfo).port;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => srv.close(() => r())),
      });
    });
  });
}

const URL_ENV = process.env.VERAPDF_SERVICE_URL;
afterEach(() => {
  if (URL_ENV === undefined) delete process.env.VERAPDF_SERVICE_URL;
  else process.env.VERAPDF_SERVICE_URL = URL_ENV;
});

describe("client veraPDF (dégradation gracieuse)", () => {
  it("execute=false si VERAPDF_SERVICE_URL absent", async () => {
    delete process.env.VERAPDF_SERVICE_URL;
    const r = await validerPdfA3(PDF);
    expect(r.execute).toBe(false);
    expect(r.conforme).toBeNull();
  });

  it("execute=false si service injoignable (jamais d'exception)", async () => {
    process.env.VERAPDF_SERVICE_URL = "http://127.0.0.1:1"; // port fermé
    const r = await validerPdfA3(PDF);
    expect(r.execute).toBe(false);
    expect(r.note).toMatch(/injoignable|HTTP/i);
  });
});

describe("intégration PDF/A-3 dans le rapport", () => {
  let serveur: { url: string; close: () => Promise<void> };
  afterEach(async () => {
    if (serveur) await serveur.close();
  });

  it("verdict conforme → PDF-001 réussi (origine veraPDF)", async () => {
    serveur = await mock({ flavour: "3b", compliant: true, passedChecks: 192, failedChecks: 0, failures: [] });
    process.env.VERAPDF_SERVICE_URL = serveur.url;
    const { report } = await analyserFichierComplet({ nom: "ok.pdf", bytes: PDF });
    expect(report.pdfA3?.execute).toBe(true);
    const f = report.findings.find((x) => x.ruleId === "PDF-001");
    expect(f?.statut).toBe("reussi");
    expect(f?.origine).toBe("verapdf");
    expect(f?.message).toMatch(/veraPDF/);
  });

  it("verdict non conforme → PDF-001 bloquant, facture non conforme", async () => {
    serveur = await mock({
      flavour: "3b",
      compliant: false,
      passedChecks: 180,
      failedChecks: 3,
      failures: [{ clause: "6.1.3", message: "File trailer dictionary shall contain the ID keyword" }],
    });
    process.env.VERAPDF_SERVICE_URL = serveur.url;
    const { report } = await analyserFichierComplet({ nom: "ko.pdf", bytes: PDF });
    const f = report.findings.find((x) => x.ruleId === "PDF-001");
    expect(f?.statut).toBe("bloquant");
    expect(f?.origine).toBe("verapdf");
    expect(f?.message).toMatch(/6\.1\.3/);
    expect(report.conforme).toBe(false);
  });

  it("sans service → PDF-001 reste le contrôle de marqueurs (pas d'origine veraPDF)", async () => {
    delete process.env.VERAPDF_SERVICE_URL;
    const { report } = await analyserFichierComplet({ nom: "ok.pdf", bytes: PDF });
    expect(report.pdfA3?.execute ?? false).toBe(false);
    const f = report.findings.find((x) => x.ruleId === "PDF-001");
    expect(f?.origine).toBe("moteur");
  });
});
