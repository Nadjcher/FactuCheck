import { describe, it, expect, afterEach } from "vitest";
import { authentifierApi } from "./api-auth";
import { versReponsePublique } from "./api-schema";
import { analyserFichier } from "./engine";
import { CII_EXEMPLE_CONFORME } from "./engine/__fixtures__/invoices";
import { POST, OPTIONS } from "@/app/api/v1/validate/route";

function req(headers: Record<string, string>, body?: BodyInit) {
  return new Request("http://x/api/v1/validate", { method: "POST", headers, body });
}

const ENV = process.env.FACTUCHECK_API_KEYS;
afterEach(() => {
  if (ENV === undefined) delete process.env.FACTUCHECK_API_KEYS;
  else process.env.FACTUCHECK_API_KEYS = ENV;
});

describe("authentifierApi", () => {
  it("refuse sans clé", () => {
    expect(authentifierApi(new Request("http://x")).ok).toBe(false);
  });
  it("accepte la clé demo (bridée)", () => {
    const a = authentifierApi(new Request("http://x", { headers: { authorization: "Bearer demo" } }));
    expect(a.ok).toBe(true);
    expect(a.plan).toBe("demo");
  });
  it("accepte une clé configurée (Bearer ou x-api-key)", () => {
    process.env.FACTUCHECK_API_KEYS = "k_live_abc, k_live_def";
    expect(authentifierApi(new Request("http://x", { headers: { authorization: "Bearer k_live_def" } })).ok).toBe(true);
    expect(authentifierApi(new Request("http://x", { headers: { "x-api-key": "k_live_abc" } })).ok).toBe(true);
    expect(authentifierApi(new Request("http://x", { headers: { "x-api-key": "mauvaise" } })).ok).toBe(false);
  });
});

describe("versReponsePublique", () => {
  it("expose un verdict stable et des points à corriger", () => {
    const { report } = analyserFichier({ nom: "x.xml", bytes: Buffer.from(CII_EXEMPLE_CONFORME) });
    const r = versReponsePublique(report, "x.xml");
    expect(["conforme", "partiel", "non_conforme"]).toContain(r.verdict);
    expect(typeof r.score).toBe("number");
    expect(r.format).toBe("CII");
    expect(Array.isArray(r.aCorriger)).toBe(true);
  });
});

describe("POST /api/v1/validate", () => {
  it("401 sans clé", async () => {
    const res = await POST(req({ "content-type": "application/xml" }, CII_EXEMPLE_CONFORME));
    expect(res.status).toBe(401);
  });

  it("200 + verdict conforme avec la clé demo (corps brut XML)", async () => {
    const res = await POST(req({ authorization: "Bearer demo", "content-type": "application/xml" }, CII_EXEMPLE_CONFORME));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verdict).toBe("conforme");
    expect(body.conforme).toBe(true);
    expect(body.resume.bloquants).toBe(0);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("400 si corps vide", async () => {
    const res = await POST(req({ authorization: "Bearer demo", "content-type": "application/xml" }));
    expect(res.status).toBe(400);
  });

  it("OPTIONS → 204 CORS (préflight)", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-methods")).toMatch(/POST/);
  });
});
