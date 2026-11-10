// Couverture du conteneur Factur-X (PDF/A-3) : extraction du XML embarqué et
// contrôles de conteneur (PDF-001..004). Fixtures binaires générées par
// scripts/make-facturx-pdf.mjs (voir ce script pour la portée et ses limites :
// pas de validation PDF/A-3 complète = limite assumée FC-S02).
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { analyserFichier } from "./run";

const DIR = path.join(process.cwd(), "fixtures-corpus-pdf");

interface Cas {
  fichier: string;
  conforme?: boolean;
  ruleId?: string;
  specId?: string;
}
const manifest: Cas[] = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));

function rapport(fichier: string) {
  const bytes = fs.readFileSync(path.join(DIR, fichier));
  return analyserFichier({ nom: fichier, bytes }).report;
}

describe("conteneur Factur-X PDF/A-3", () => {
  it("le manifeste couvre les PDF du dossier", () => {
    const pdfs = fs.readdirSync(DIR).filter((f) => f.endsWith(".pdf"));
    expect(manifest.length).toBe(pdfs.length);
  });

  it("OK_FACTURX_conforme.pdf : XML extrait, format FACTURX_PDF, conteneur OK", () => {
    const r = rapport("OK_FACTURX_conforme.pdf");
    expect(r.format).toBe("FACTURX_PDF");
    // Le XML a bien été extrait et parsé (sinon erreurParsing serait non nul).
    expect(r.erreurParsing).toBeNull();
    expect(r.findings.find((x) => x.ruleId === "PDF-001")?.statut).toBe("reussi"); // PDF/A-3 déclaré
    expect(r.findings.find((x) => x.ruleId === "PDF-002")?.statut).toBe("reussi"); // XML embarqué
    expect(r.findings.find((x) => x.ruleId === "PDF-003")?.statut).toBe("reussi"); // nommé factur-x.xml
    expect(r.conforme).toBe(true);
    // Conteneur jamais « exhaustif » : la validation PDF/A-3 complète (veraPDF)
    // reste hors moteur → le rapport affiche « Contrôle partiel ».
    expect(r.exhaustif).toBe(false);
  });

  for (const cas of manifest.filter((c) => !c.conforme)) {
    it(`${cas.fichier} : bloque sur ${cas.ruleId} (${cas.specId})`, () => {
      const r = rapport(cas.fichier);
      expect(r.conforme).toBe(false);
      const f = r.findings.find((x) => x.ruleId === cas.ruleId);
      expect(f?.statut).toBe("bloquant");
      expect(f?.specId).toBe(cas.specId);
    });
  }
});
