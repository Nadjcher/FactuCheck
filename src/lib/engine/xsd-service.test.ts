// Câblage du service XSD : client + intégration dans analyserFichierComplet.
// Serveur mock déterministe (pas de xmllint requis en CI).
import { describe, it, expect, afterEach } from "vitest";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { validerXsd } from "./xsd-service";
import { analyserFichierComplet } from "./run";

const CII = fs.readFileSync(path.join(process.cwd(), "fixtures-corpus/OK_CII_conforme.xml"));

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
      resolve({ url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => srv.close(() => r())) });
    });
  });
}

const URL_ENV = process.env.XSD_SERVICE_URL;
afterEach(() => {
  if (URL_ENV === undefined) delete process.env.XSD_SERVICE_URL;
  else process.env.XSD_SERVICE_URL = URL_ENV;
});

describe("client XSD (dégradation gracieuse)", () => {
  it("execute=false si XSD_SERVICE_URL absent", async () => {
    delete process.env.XSD_SERVICE_URL;
    const r = await validerXsd("<x/>", "CII");
    expect(r.execute).toBe(false);
    expect(r.valide).toBeNull();
  });

  it("execute=false pour un format sans schéma (INCONNU)", async () => {
    process.env.XSD_SERVICE_URL = "http://127.0.0.1:1";
    const r = await validerXsd("<x/>", "INCONNU");
    expect(r.execute).toBe(false);
  });

  it("execute=false si service injoignable (jamais d'exception)", async () => {
    process.env.XSD_SERVICE_URL = "http://127.0.0.1:1";
    const r = await validerXsd("<x/>", "CII");
    expect(r.execute).toBe(false);
    expect(r.note).toMatch(/injoignable|HTTP/i);
  });
});

describe("intégration XSD dans le rapport", () => {
  let serveur: { url: string; close: () => Promise<void> };
  afterEach(async () => {
    if (serveur) await serveur.close();
  });

  it("XSD valide → FMT-005 réussi (origine xsd)", async () => {
    serveur = await mock({ format: "CII", valid: true, errors: [] });
    process.env.XSD_SERVICE_URL = serveur.url;
    const { report } = await analyserFichierComplet({ nom: "ok.xml", bytes: CII });
    expect(report.xsd?.execute).toBe(true);
    const f = report.findings.find((x) => x.ruleId === "FMT-005");
    expect(f?.statut).toBe("reussi");
    expect(f?.origine).toBe("xsd");
  });

  it("XSD invalide → FMT-005 bloquant, facture non conforme", async () => {
    serveur = await mock({
      format: "CII",
      valid: false,
      errors: [{ line: 34, message: "Missing child element BuyerTradeParty" }],
    });
    process.env.XSD_SERVICE_URL = serveur.url;
    const { report } = await analyserFichierComplet({ nom: "ko.xml", bytes: CII });
    const f = report.findings.find((x) => x.ruleId === "FMT-005");
    expect(f?.statut).toBe("bloquant");
    expect(f?.origine).toBe("xsd");
    expect(f?.message).toMatch(/BuyerTradeParty/);
    expect(report.conforme).toBe(false);
  });

  it("sans service → FMT-005 reste le contrôle best-effort (origine moteur)", async () => {
    delete process.env.XSD_SERVICE_URL;
    const { report } = await analyserFichierComplet({ nom: "ok.xml", bytes: CII });
    expect(report.xsd?.execute ?? false).toBe(false);
    const f = report.findings.find((x) => x.ruleId === "FMT-005");
    expect(f?.origine).toBe("moteur");
  });
});
