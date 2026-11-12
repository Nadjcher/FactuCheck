// La facture d'exemple publique doit être RÉELLEMENT conforme à travers le moteur
// complet (métier + schematron officiel maison), pas seulement via Saxon.
// Garantit que « Essayer avec une facture d'exemple » donne un rapport tout au vert.
import { describe, it, expect } from "vitest";
import { analyserFichierComplet } from "./run";
import { CII_EXEMPLE_CONFORME, toBuffer } from "./__fixtures__/invoices";

describe("facture d'exemple publique", () => {
  it("est conforme : 0 bloquant métier ET 0 bloquant schematron officiel", async () => {
    const { report } = await analyserFichierComplet({
      nom: "facture-exemple-factur-x.xml",
      bytes: toBuffer(CII_EXEMPLE_CONFORME),
    });
    expect(report.counts.bloquant).toBe(0);
    if (report.schematron?.execute) {
      expect(report.schematron.bloquants).toBe(0);
    }
    expect(report.conforme).toBe(true);
    // XML conforme → pleinement exhaustif = « Conforme » (le seul axe non
    // exhaustif, PDF/A-3, ne concerne que les fichiers PDF).
    expect(report.exhaustif).toBe(true);
  });
});
