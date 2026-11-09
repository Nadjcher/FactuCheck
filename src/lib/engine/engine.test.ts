import { describe, it, expect } from "vitest";
import { analyserFichier, parseInvoice, REGLES } from "./index";
import {
  CII_VALIDE,
  CII_INVALIDE,
  UBL_VALIDE,
  toBuffer,
} from "./__fixtures__/invoices";

function analyse(nom: string, xml: string) {
  return analyserFichier({ nom, bytes: toBuffer(xml) });
}

describe("parsing", () => {
  it("détecte le format CII (Factur-X XML)", () => {
    const inv = parseInvoice({ nom: "f.xml", bytes: toBuffer(CII_VALIDE) });
    expect(inv.format).toBe("CII");
    expect(inv.erreurParsing).toBeNull();
  });

  it("détecte le format UBL", () => {
    const inv = parseInvoice({ nom: "f.xml", bytes: toBuffer(UBL_VALIDE) });
    expect(inv.format).toBe("UBL");
  });

  it("extrait les champs clés d'une facture CII", () => {
    const inv = parseInvoice({ nom: "f.xml", bytes: toBuffer(CII_VALIDE) });
    expect(inv.numero).toBe("FA-2026-0001");
    expect(inv.emetteur.siren).toBe("123456782");
    expect(inv.client.siren).toBe("987654329");
    expect(inv.emetteur.numeroTVA).toBe("FR32123456782");
    expect(inv.montantHT).toBe(1000);
    expect(inv.montantTVA).toBe(200);
    expect(inv.montantTTC).toBe(1200);
    expect(inv.profilFacturx).toBe("BASIC");
  });

  it("extrait les champs clés d'une facture UBL", () => {
    const inv = parseInvoice({ nom: "f.xml", bytes: toBuffer(UBL_VALIDE) });
    expect(inv.numero).toBe("INV-2026-42");
    expect(inv.emetteur.siren).toBe("123456782");
    expect(inv.client.siren).toBe("987654329");
    expect(inv.montantTTC).toBe(1200);
  });

  it("signale un XML non reconnu", () => {
    const inv = parseInvoice({ nom: "x.xml", bytes: toBuffer("<foo/>") });
    expect(inv.format).toBe("INCONNU");
    expect(inv.erreurParsing).not.toBeNull();
  });
});

describe("évaluation — facture valide", () => {
  const { report } = analyse("valide.xml", CII_VALIDE);

  it("est conforme (aucun bloquant)", () => {
    expect(report.conforme).toBe(true);
    expect(report.counts.bloquant).toBe(0);
  });

  it("obtient un score élevé", () => {
    expect(report.score).toBeGreaterThanOrEqual(90);
  });

  it("valide la cohérence des montants (MNT-001)", () => {
    const f = report.findings.find((x) => x.ruleId === "MNT-001");
    expect(f?.statut).toBe("reussi");
  });
});

describe("évaluation — facture invalide", () => {
  const { report } = analyse("invalide.xml", CII_INVALIDE);

  it("n'est pas conforme", () => {
    expect(report.conforme).toBe(false);
    expect(report.counts.bloquant).toBeGreaterThan(0);
  });

  it("bloque sur le SIREN client manquant (MEN-002)", () => {
    const f = report.findings.find((x) => x.ruleId === "MEN-002");
    expect(f?.statut).toBe("bloquant");
    expect(f?.commentCorriger).not.toBeNull();
  });

  it("bloque sur l'incohérence des montants (MNT-001)", () => {
    const f = report.findings.find((x) => x.ruleId === "MNT-001");
    expect(f?.statut).toBe("bloquant");
  });

  it("avertit sur l'adresse de livraison absente (MEN-004)", () => {
    const f = report.findings.find((x) => x.ruleId === "MEN-004");
    expect(f?.statut).toBe("avertissement");
  });
});

describe("catalogue de règles", () => {
  it("toutes les règles ont les champs requis", () => {
    for (const r of REGLES) {
      expect(r.id).toBeTruthy();
      expect(r.libelle).toBeTruthy();
      expect(["bloquant", "avertissement"]).toContain(r.severite);
      expect(r.commentCorriger).toBeTruthy();
    }
  });

  it("toutes les règles sont encore marquées « À VÉRIFIER » (source non confirmée)", () => {
    // Garde-fou : tant qu'une source officielle n'est pas renseignée,
    // aVerifier doit rester true et source null.
    for (const r of REGLES) {
      if (r.aVerifier) expect(r.source).toBeNull();
      if (r.source) expect(r.aVerifier).toBe(false);
    }
  });

  it("chaque règle a une implémentation de contrôle", async () => {
    const { checks } = await import("./checks");
    for (const r of REGLES) {
      expect(typeof checks[r.id]).toBe("function");
    }
  });
});
