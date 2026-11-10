// Fermeture complète de l'exhaustivité : avec les DEUX validateurs structurels
// branchés (veraPDF pour PDF/A-3 + xmllint pour XSD), une facture Factur-X
// conforme n'est plus « Contrôle partiel » mais pleinement exhaustive.
//
// Ne s'exécute que si les deux services réels sont configurés :
//   VERAPDF_SERVICE_URL=... XSD_SERVICE_URL=... npx vitest run validation-closure
// Sinon ignoré.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { analyserFichierComplet } from "./run";

const actif = Boolean(process.env.VERAPDF_SERVICE_URL && process.env.XSD_SERVICE_URL);
const PDF = path.join(process.cwd(), "fixtures-corpus-pdf/OK_FACTURX_conforme.pdf");

(actif ? describe : describe.skip)("fermeture de l'exhaustivité (veraPDF + XSD)", () => {
  it("Factur-X conforme → exhaustif = true (plus de « Contrôle partiel »)", async () => {
    const bytes = fs.readFileSync(PDF);
    const { report } = await analyserFichierComplet({ nom: "ok.pdf", bytes });
    expect(report.pdfA3?.execute).toBe(true);
    expect(report.pdfA3?.conforme).toBe(true);
    expect(report.xsd?.execute).toBe(true);
    expect(report.xsd?.valide).toBe(true);
    // Les deux seuls axes exhaustif:false (PDF-001, FMT-005) sont couverts
    // → le rapport n'est plus « Contrôle partiel ».
    expect(report.exhaustif).toBe(true);
    // PDF-001 (PDF/A-3) et FMT-005 (XSD) passent en « réussi » via les services.
    expect(report.findings.find((f) => f.ruleId === "PDF-001")?.statut).toBe("reussi");
    expect(report.findings.find((f) => f.ruleId === "FMT-005")?.statut).toBe("reussi");
    // NB : la conformité globale dépend aussi du Schematron officiel (axe sémantique),
    // indépendant de l'exhaustivité structurelle testée ici.
  });
});
