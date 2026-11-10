// Validation PDF/A-3 des fixtures Factur-X par le moteur de RÉFÉRENCE veraPDF
// (ISO 19005-3, implémentation de la PDF Association). Prouve que nos fixtures
// sont de vrais conteneurs PDF/A-3B, pas des approximations.
//
// Ne s'exécute que si VERAPDF_CLI pointe vers un binaire veraPDF installé :
//   node scripts/verapdf-setup.mjs
//   VERAPDF_CLI=.verapdf/app/verapdf npx vitest run verapdf.pdfa
// Sinon ignoré (CI sans Java/veraPDF).
//
// Séparation importante : la conformité PDF/A-3 (structure du conteneur) est
// INDÉPENDANTE de la conformité Factur-X (nom factur-x.xml, profil…). Les deux
// fixtures sont PDF/A-3B valides ; seule OK_* respecte en plus la règle Factur-X
// FC-S03 (vérifiée côté moteur dans facturx-pdf.test.ts).
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CLI = process.env.VERAPDF_CLI;
const actif = Boolean(CLI && fs.existsSync(CLI));
const DIR = path.join(process.cwd(), "fixtures-corpus-pdf");

function estConforme(pdf: string): { compliant: boolean; passed: number; failed: number } {
  const xml = execFileSync(CLI as string, ["--flavour", "3b", "--format", "xml", pdf], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const compliant = /isCompliant="true"/.test(xml);
  const passed = Number(xml.match(/passedChecks="(\d+)"/)?.[1] ?? "0");
  const failed = Number(xml.match(/failedChecks="(\d+)"/)?.[1] ?? "0");
  return { compliant, passed, failed };
}

if (!actif) {
  describe.skip("validation PDF/A-3 (veraPDF) — définir VERAPDF_CLI", () => {
    it("ignoré : veraPDF non configuré", () => {});
  });
} else {
  describe("validation PDF/A-3 des fixtures Factur-X (veraPDF)", () => {
    for (const f of ["OK_FACTURX_conforme.pdf", "KO_FACTURX_FC-S03_nom.pdf"]) {
      it(`${f} est PDF/A-3B conforme`, () => {
        const r = estConforme(path.join(DIR, f));
        expect(r.failed).toBe(0);
        expect(r.compliant).toBe(true);
      });
    }
  });
}
