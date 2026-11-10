// Validation Schematron (contrôles officiels) via node-schematron (pur JS).
// Exécute n'importe quel .sch : les schematrons maison (schematron/factucheck-*.sch)
// ou les artefacts officiels déposés dans schematron/official/ (prioritaires).
import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import type {
  Categorie,
  FormatFacture,
  Finding,
  SchematronResultat,
} from "./types";

const DOSSIER = path.join(process.cwd(), "schematron");

interface SchFichier {
  chemin: string;
  officiel: boolean;
}

/** Choisit le schematron pour un format : officiel prioritaire, sinon maison. */
function choisirSch(format: FormatFacture): SchFichier | null {
  const base =
    format === "UBL" ? "ubl" : format === "CII" || format === "FACTURX_PDF" ? "cii" : null;
  if (!base) return null;
  const officiel = path.join(DOSSIER, "official", `${base}.sch`);
  if (fs.existsSync(officiel)) return { chemin: officiel, officiel: true };
  const maison = path.join(DOSSIER, `factucheck-${base}.sch`);
  if (fs.existsSync(maison)) return { chemin: maison, officiel: false };
  return null;
}

/** Pré-parse le .sch pour récupérer le flag (fatal/warning) de chaque assert/report. */
function construireFlags(schXml: string): Map<string, string> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    isArray: (name) => ["pattern", "rule", "assert", "report"].includes(name),
  });
  const flags = new Map<string, string>();
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(schXml) as Record<string, unknown>;
  } catch {
    return flags;
  }
  const patterns = ((doc.schema as Record<string, unknown>)?.pattern ?? []) as unknown[];
  for (const p of patterns) {
    const rules = ((p as Record<string, unknown>).rule ?? []) as unknown[];
    for (const r of rules) {
      for (const cle of ["assert", "report"] as const) {
        const items = ((r as Record<string, unknown>)[cle] ?? []) as unknown[];
        for (const a of items) {
          const rec = a as Record<string, unknown>;
          const id = rec["@_id"];
          const flag = rec["@_flag"];
          if (id) flags.set(String(id), flag ? String(flag) : "fatal");
        }
      }
    }
  }
  return flags;
}

function categoriePour(ruleId: string): Categorie {
  const u = ruleId.toUpperCase();
  if (u.startsWith("BR-CO") || u.includes("MONTANT") || u.includes("TOTAL")) return "montants";
  if (u.includes("CTC") || u.includes("FR") || u.includes("SIREN") || u.includes("MEN"))
    return "mentions";
  return "format";
}

function extraireCode(message: string, assertId?: string): string {
  if (assertId) return assertId;
  const m = message.match(/\[([A-Z0-9][A-Z0-9-]*)\]/);
  return m ? m[1] : "SCH";
}

/**
 * Valide une facture XML avec le schematron adapté à son format.
 * Dégradation gracieuse : renvoie execute=false si indisponible (jamais d'exception).
 */
export async function validerSchematron(
  xml: string | null,
  format: FormatFacture,
  opts?: { fichierSch?: string },
): Promise<SchematronResultat> {
  const vide = (note: string): SchematronResultat => ({
    execute: false,
    moteur: "node-schematron",
    source: "—",
    findings: [],
    bloquants: 0,
    note,
  });

  if (!xml) return vide("Aucun XML exploitable à valider.");
  const sch = opts?.fichierSch
    ? { chemin: opts.fichierSch, officiel: /[/\\]official[/\\]/.test(opts.fichierSch) }
    : choisirSch(format);
  if (!sch) return vide(`Aucun schematron disponible pour le format ${format}.`);

  let schXml: string;
  try {
    schXml = fs.readFileSync(sch.chemin, "utf8");
  } catch (e) {
    return vide(`Lecture du schematron impossible : ${(e as Error).message}`);
  }

  let Schema: typeof import("node-schematron").Schema;
  try {
    const mod = (await import("node-schematron")) as unknown as {
      Schema?: typeof import("node-schematron").Schema;
      default?: { Schema: typeof import("node-schematron").Schema };
    };
    Schema = mod.Schema ?? mod.default!.Schema;
  } catch (e) {
    return vide(`Moteur Schematron indisponible : ${(e as Error).message}`);
  }

  const flags = construireFlags(schXml);
  const source = sch.officiel
    ? `${path.basename(sch.chemin)} (officiel)`
    : `${path.basename(sch.chemin)} (maison, à vérifier)`;

  let resultats: Array<{ assertId?: string; isReport?: boolean; message?: string }>;
  try {
    resultats = Schema.fromString(schXml).validateString(xml, {
      debug: true,
    }) as typeof resultats;
  } catch (e) {
    return vide(`Validation Schematron en échec : ${(e as Error).message}`);
  }

  const findings: Finding[] = [];
  let bloquants = 0;
  for (const r of resultats) {
    const message = (r.message ?? "").trim();
    const ruleId = extraireCode(message, r.assertId);
    const flag = (flags.get(ruleId) ?? "fatal").toLowerCase();
    const estBloquant = !r.isReport && flag !== "warning" && flag !== "info";
    const statut = estBloquant ? "bloquant" : "avertissement";
    if (estBloquant) bloquants++;
    findings.push({
      ruleId,
      libelle: `Contrôle ${ruleId}`,
      categorie: categoriePour(ruleId),
      statut,
      message: message || `Règle ${ruleId} non respectée.`,
      commentCorriger: "Corrigez la facture pour respecter cette règle de validation.",
      infobulle: "Contrôle issu de la validation Schematron.",
      source,
      aVerifier: !sch.officiel,
      origine: "schematron",
    });
  }

  return {
    execute: true,
    moteur: "node-schematron",
    source,
    findings,
    bloquants,
    note: null,
  };
}
