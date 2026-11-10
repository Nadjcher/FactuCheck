import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { analyserFichier } from "./run";

// Jeu de factures de test généré par scripts/generate-corpus.mjs.
// Chaque fichier KO doit déclencher sa règle (bloquant) ; le fichier OK est conforme.
// On utilise le moteur métier synchrone (déterministe, sans dépendance aux
// schematrons officiels).
const DOSSIER = path.join(process.cwd(), "fixtures-corpus");

interface Cas {
  fichier: string;
  conforme?: boolean;
  ruleId?: string;
  specId?: string;
}

const manifest: Cas[] = JSON.parse(
  fs.readFileSync(path.join(DOSSIER, "manifest.json"), "utf8"),
);

function analyse(fichier: string) {
  const bytes = fs.readFileSync(path.join(DOSSIER, fichier));
  return analyserFichier({ nom: fichier, bytes }).report;
}

describe("jeu de factures de test (fixtures-corpus)", () => {
  it("le manifeste couvre les fichiers du dossier", () => {
    const fichiers = fs.readdirSync(DOSSIER).filter((f) => f.endsWith(".xml"));
    expect(manifest.length).toBe(fichiers.length);
  });

  for (const cas of manifest) {
    if (cas.conforme) {
      it(`${cas.fichier} → conforme`, () => {
        expect(analyse(cas.fichier).conforme).toBe(true);
      });
    } else {
      it(`${cas.fichier} → bloque sur ${cas.ruleId} (${cas.specId})`, () => {
        const report = analyse(cas.fichier);
        expect(report.conforme).toBe(false);
        const f = report.findings.find((x) => x.ruleId === cas.ruleId);
        expect(f?.statut).toBe("bloquant");
        expect(f?.specId).toBe(cas.specId);
      });
    }
  }
});
