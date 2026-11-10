// Test différentiel : compare notre moteur (node-schematron + préprocesseur
// maison) au moteur de référence XSLT (Saxon) sur les MÊMES schematrons et les
// mêmes factures. Tout écart de règles signalées est un bug du préprocesseur.
//
// Ne s'exécute que si les artefacts Saxon sont fournis par variables d'env :
//   SAXON_DIR     : dossier contenant saxon.jar, xmlresolver.jar et les
//                   XSLT de validation compilés (voir scripts/diff-saxon.md)
//   DIFF_CORPUS   : dossier de factures XML à tester
// Sinon le test est ignoré (CI sans Java).
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { validerSchematron } from "./schematron";
import type { FormatFacture } from "./types";

const SAXON = process.env.SAXON_DIR;
const CORPUS = process.env.DIFF_CORPUS;
const actif = Boolean(SAXON && CORPUS && fs.existsSync(SAXON) && fs.existsSync(CORPUS));

const CIBLES = [
  { nom: "FNFE-CII", fichierSch: "schematron/official/fnfe-cii.sch", xsl: "fnfe-cii-validation.xsl", format: "CII" as FormatFacture, base: "cii" },
  { nom: "EN16931-CII", fichierSch: "schematron/official/cii.sch", xsl: "en16931-cii-validation.xsl", format: "CII" as FormatFacture, base: "cii" },
  { nom: "FNFE-UBL", fichierSch: "schematron/official/fnfe-ubl.sch", xsl: "fnfe-ubl-validation.xsl", format: "UBL" as FormatFacture, base: "ubl" },
  { nom: "EN16931-UBL", fichierSch: "schematron/official/ubl.sch", xsl: "en16931-ubl-validation.xsl", format: "UBL" as FormatFacture, base: "ubl" },
];

/** Classe une facture du corpus (cii|ubl) via le manifeste, sinon par son nom. */
function baseDe(dir: string, fichier: string): "cii" | "ubl" | null {
  try {
    const man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8")) as Array<{
      fichier: string;
      format?: string;
    }>;
    const e = man.find((m) => m.fichier === fichier);
    if (e?.format === "UBL") return "ubl";
    if (e?.format === "CII") return "cii";
  } catch {
    /* pas de manifeste : repli sur le nom */
  }
  return /ubl/i.test(fichier) ? "ubl" : "cii";
}

/** Identifiants des assertions signalées (failed-assert + successful-report) dans le SVRL. */
function idsSvrl(svrl: string): Set<string> {
  const ids = new Set<string>();
  for (const m of svrl.matchAll(/<svrl:(?:failed-assert|successful-report)\b([\s\S]*?)>/g)) {
    const id = m[1].match(/\bid="([^"]+)"/);
    if (id) ids.add(id[1]);
  }
  return ids;
}

function idsSaxon(xsl: string, invoice: string): Set<string> {
  const out = execFileSync(
    "java",
    [
      "-cp",
      `${SAXON}/saxon.jar:${SAXON}/xmlresolver.jar`,
      "net.sf.saxon.Transform",
      `-s:${invoice}`,
      `-xsl:${SAXON}/${xsl}`,
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return idsSvrl(out);
}

if (!actif) {
  describe.skip("différentiel Saxon ↔ node-schematron (définir SAXON_DIR + DIFF_CORPUS)", () => {
    it("ignoré : Saxon non configuré", () => {});
  });
} else {
  describe("différentiel Saxon ↔ node-schematron", () => {
    const toutes = fs.readdirSync(CORPUS as string).filter((f) => f.endsWith(".xml"));

    for (const cible of CIBLES) {
      // Un schematron UBL ne s'applique qu'aux factures UBL (et vice-versa).
      const factures = toutes.filter((f) => baseDe(CORPUS as string, f) === cible.base);
      for (const facture of factures) {
        it(`${cible.nom} / ${facture} : mêmes règles signalées`, async () => {
          const chemin = path.join(CORPUS as string, facture);
          const xml = fs.readFileSync(chemin, "utf8").replace(/^﻿/, "");

          const res = await validerSchematron(xml, cible.format, { fichierSch: cible.fichierSch });
          const nous = new Set(res.findings.map((f) => f.ruleId));
          const ref = idsSaxon(cible.xsl, chemin);

          const manquants = [...ref].filter((x) => !nous.has(x)).sort();
          const enTrop = [...nous].filter((x) => !ref.has(x)).sort();
          if (manquants.length || enTrop.length) {
            throw new Error(
              `Écart ${cible.nom} / ${facture}\n  Saxon seulement : ${manquants.join(", ") || "—"}\n  Nous seulement : ${enTrop.join(", ") || "—"}`,
            );
          }
          expect(manquants.length + enTrop.length).toBe(0);
        });
      }
    }
  });
}
