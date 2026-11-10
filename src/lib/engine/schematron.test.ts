import { describe, it, expect } from "vitest";
import { validerSchematron } from "./schematron";
import { analyserFichierComplet } from "./run";
import {
  CII_VALIDE,
  UBL_VALIDE,
  CII_LIGNES_INCOHERENTES,
  CII_TVA_INCOHERENTE,
  toBuffer,
} from "./__fixtures__/invoices";

// On cible explicitement les schematrons MAISON pour des tests déterministes,
// indépendamment de la présence éventuelle de schematron/official/*.sch.
const CII = { fichierSch: "schematron/factucheck-cii.sch" };
const UBL = { fichierSch: "schematron/factucheck-ubl.sch" };

describe("validation Schematron (maison)", () => {
  it("ne signale aucune anomalie sur une facture CII conforme", async () => {
    const res = await validerSchematron(CII_VALIDE, "CII", CII);
    expect(res.execute).toBe(true);
    expect(res.bloquants).toBe(0);
    expect(res.findings).toHaveLength(0);
  });

  it("ne signale aucune anomalie sur une facture UBL conforme", async () => {
    const res = await validerSchematron(UBL_VALIDE, "UBL", UBL);
    expect(res.execute).toBe(true);
    expect(res.bloquants).toBe(0);
  });

  it("détecte une incohérence de somme des lignes (BR-CO-10)", async () => {
    const res = await validerSchematron(CII_LIGNES_INCOHERENTES, "CII", CII);
    expect(res.bloquants).toBeGreaterThan(0);
    expect(res.findings.some((f) => f.ruleId === "BR-CO-10")).toBe(true);
  });

  it("détecte une TVA par taux erronée (BR-CO-17)", async () => {
    const res = await validerSchematron(CII_TVA_INCOHERENTE, "CII", CII);
    expect(res.bloquants).toBeGreaterThan(0);
    expect(res.findings.some((f) => f.ruleId === "BR-CO-17")).toBe(true);
  });

  it("ne signale pas BR-CO-17 sur une TVA par taux correcte", async () => {
    const res = await validerSchematron(CII_VALIDE, "CII", CII);
    expect(res.findings.some((f) => f.ruleId === "BR-CO-17")).toBe(false);
  });

  it("se dégrade proprement sans XML", async () => {
    const res = await validerSchematron(null, "CII", CII);
    expect(res.execute).toBe(false);
    expect(res.findings).toHaveLength(0);
  });

  it("pipeline complet : les bloquants Schematron rendent la facture non conforme", async () => {
    const { report } = await analyserFichierComplet({
      nom: "lignes.xml",
      bytes: toBuffer(CII_LIGNES_INCOHERENTES),
    });
    expect(report.schematron?.execute).toBe(true);
    expect(report.conforme).toBe(false);
  });
});
