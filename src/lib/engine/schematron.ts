// Validation Schematron (contrôles officiels) via node-schematron (pur JS).
// Exécute, par format, le(s) schematron(s) présent(s) :
//   - schematron/official/{cii,ubl}.sch      → EN 16931 (ConnectingEurope)
//   - schematron/official/fnfe-{cii,ubl}.sch → BR-FR FNFE-MPE (EXTENDED-CTC-FR)
//   - sinon schematron/factucheck-{cii,ubl}.sch (maison, sourcés, « à vérifier »)
// Les .sch sont transformés au chargement (transformerSchematron) pour être
// exécutables par node-schematron, et les fonctions custom:* FNFE sont
// enregistrées dans fontoxpath.
import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import type { Categorie, FormatFacture, Finding, SchematronResultat } from "./types";
import { transformerSchematron } from "./schematron-transform";
import { registerFnfeFunctions } from "./schematron-functions";

const DOSSIER = path.join(process.cwd(), "schematron");

interface SchInfo {
  chemin: string;
  officiel: boolean;
  libelle: string;
}

function baseFormat(format: FormatFacture): "cii" | "ubl" | null {
  if (format === "UBL") return "ubl";
  if (format === "CII" || format === "FACTURX_PDF") return "cii";
  return null;
}

/** Liste les schematrons à appliquer : officiels présents, sinon maison. */
function candidatsSch(format: FormatFacture): SchInfo[] {
  const base = baseFormat(format);
  if (!base) return [];
  const off: SchInfo[] = [];
  const en = path.join(DOSSIER, "official", `${base}.sch`);
  const fnfe = path.join(DOSSIER, "official", `fnfe-${base}.sch`);
  if (fs.existsSync(en)) off.push({ chemin: en, officiel: true, libelle: `${base}.sch (EN 16931)` });
  if (fs.existsSync(fnfe)) off.push({ chemin: fnfe, officiel: true, libelle: `fnfe-${base}.sch (FNFE-MPE)` });
  if (off.length) return off;
  const maison = path.join(DOSSIER, `factucheck-${base}.sch`);
  if (fs.existsSync(maison)) return [{ chemin: maison, officiel: false, libelle: `factucheck-${base}.sch (maison)` }];
  return [];
}

/** Flag (fatal/warning) de chaque assert/report, par id. */
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
  if (u.includes("CTC") || u.includes("FR") || u.includes("SIREN") || u.includes("SIRET") || u.includes("MEN")) return "mentions";
  return "format";
}

function extraireCode(message: string, assertId?: string): string {
  if (assertId) return assertId;
  const m = message.match(/\[([A-Z0-9][A-Z0-9/-]*)\]/);
  return m ? m[1] : "SCH";
}

// Cache des schematrons compilés (par chemin + mtime).
interface CacheEntry {
  mtimeMs: number;
  schema: import("node-schematron").Schema;
  flags: Map<string, string>;
}
const cache = new Map<string, CacheEntry>();

type NodeSchematron = typeof import("node-schematron");

async function chargerNodeSchematron(): Promise<NodeSchematron | null> {
  try {
    const mod = (await import("node-schematron")) as unknown as {
      Schema?: NodeSchematron["Schema"];
      registerCustomXPathFunction?: NodeSchematron["registerCustomXPathFunction"];
      default?: NodeSchematron;
    };
    if (mod.Schema && mod.registerCustomXPathFunction) return mod as unknown as NodeSchematron;
    return (mod.default as NodeSchematron) ?? null;
  } catch {
    return null;
  }
}

function obtenirSchema(ns: NodeSchematron, chemin: string): CacheEntry {
  const st = fs.statSync(chemin);
  const existant = cache.get(chemin);
  if (existant && existant.mtimeMs === st.mtimeMs) return existant;
  const transforme = transformerSchematron(fs.readFileSync(chemin, "utf8"));
  const entry: CacheEntry = {
    mtimeMs: st.mtimeMs,
    schema: ns.Schema.fromString(transforme),
    flags: construireFlags(transforme),
  };
  cache.set(chemin, entry);
  return entry;
}

/**
 * Valide une facture XML avec le(s) schematron(s) adaptés à son format.
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
  const schs: SchInfo[] = opts?.fichierSch
    ? [{ chemin: opts.fichierSch, officiel: /[/\\]official[/\\]/.test(opts.fichierSch), libelle: path.basename(opts.fichierSch) }]
    : candidatsSch(format);
  if (!schs.length) return vide(`Aucun schematron disponible pour le format ${format}.`);

  const ns = await chargerNodeSchematron();
  if (!ns) return vide("Moteur Schematron indisponible.");
  registerFnfeFunctions(ns.registerCustomXPathFunction);

  const findings: Finding[] = [];
  const sources: string[] = [];
  const notes: string[] = [];
  let bloquants = 0;

  for (const sch of schs) {
    let entry: CacheEntry;
    let resultats: Array<{ assertId?: string; isReport?: boolean; message?: string }>;
    try {
      entry = obtenirSchema(ns, sch.chemin);
      resultats = entry.schema.validateString(xml, { debug: true }) as typeof resultats;
    } catch (e) {
      notes.push(`${sch.libelle} : ${(e as Error).message}`);
      continue;
    }
    sources.push(sch.libelle);
    for (const r of resultats) {
      const message = (r.message ?? "").trim();
      const ruleId = extraireCode(message, r.assertId);
      const flag = (entry.flags.get(ruleId) ?? "fatal").toLowerCase();
      const estBloquant = !r.isReport && flag !== "warning" && flag !== "info";
      if (estBloquant) bloquants++;
      findings.push({
        ruleId,
        libelle: `Contrôle ${ruleId}`,
        categorie: categoriePour(ruleId),
        statut: estBloquant ? "bloquant" : "avertissement",
        message: message || `Règle ${ruleId} non respectée.`,
        commentCorriger: "Corrigez la facture pour respecter cette règle de validation.",
        infobulle: "Contrôle issu de la validation Schematron.",
        source: sch.libelle,
        aVerifier: !sch.officiel,
        origine: "schematron",
      });
    }
  }

  if (sources.length === 0) return vide(notes.join(" | ") || "Validation Schematron indisponible.");

  return {
    execute: true,
    moteur: "node-schematron",
    source: sources.join(" + "),
    findings,
    bloquants,
    note: notes.length ? notes.join(" | ") : null,
  };
}
