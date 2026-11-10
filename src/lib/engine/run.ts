// Orchestration : parse → applique les règles → produit un Rapport scoré.
import type {
  Finding,
  ParsedInvoice,
  Report,
  ReportCounts,
  Severite,
  StatutFinding,
} from "./types";
import { checks } from "./checks";
import { REGLES } from "./rules-loader";
import { parseInvoice, type EntreeFichier } from "./parse";
import { validerSchematron } from "./schematron";
import { validerPdfA3 } from "./verapdf-service";
import type { PdfA3Resultat } from "./types";

const POIDS: Record<Severite, number> = { bloquant: 3, avertissement: 1 };

/** Règle couverte par une validation externe exhaustive (ne force plus « partiel »). */
function couvertParValidateur(ruleId: string, pdfA3Execute: boolean): boolean {
  // PDF-001 (FC-S02, PDF/A-3) est pleinement validé dès que veraPDF a tourné.
  return ruleId === "PDF-001" && pdfA3Execute;
}

/** Recalcule counts, score (pondéré), conformité et exhaustivité depuis les findings « moteur ». */
function recalculer(report: Report, pdfA3Execute: boolean): void {
  const counts: ReportCounts = { reussi: 0, avertissement: 0, bloquant: 0, nonApplicable: 0 };
  let poidsTotal = 0;
  let poidsReussi = 0;
  let exhaustif = true;

  for (const regle of REGLES) {
    const f = report.findings.find((x) => x.ruleId === regle.id);
    if (!f) continue;
    if (f.statut === "reussi") counts.reussi++;
    else if (f.statut === "avertissement") counts.avertissement++;
    else if (f.statut === "bloquant") counts.bloquant++;
    else counts.nonApplicable++;

    const applicable = f.statut !== "non_applicable";
    if (applicable) {
      poidsTotal += POIDS[regle.severite];
      if (f.statut === "reussi") poidsReussi += POIDS[regle.severite];
      if (regle.exhaustif === false && !couvertParValidateur(regle.id, pdfA3Execute)) {
        exhaustif = false;
      }
    }
  }
  report.counts = counts;
  report.score = poidsTotal === 0 ? 0 : Math.round((poidsReussi / poidsTotal) * 100);
  report.conforme = counts.bloquant === 0 && report.erreurParsing == null;
  report.exhaustif = exhaustif;
}

/** Intègre le verdict PDF/A-3 (veraPDF) : surcharge PDF-001 et recalcule le rapport. */
function appliquerPdfA3(report: Report, pdfA3: PdfA3Resultat): void {
  report.pdfA3 = pdfA3;
  if (!pdfA3.execute) return;
  const f = report.findings.find((x) => x.ruleId === "PDF-001");
  if (f && f.statut !== "non_applicable") {
    if (pdfA3.conforme) {
      f.statut = "reussi";
      f.message = `PDF/A-${pdfA3.flavour} validé par veraPDF (${pdfA3.passed} contrôles, 0 échec).`;
      f.commentCorriger = null;
    } else {
      const detail = pdfA3.details.map((d) => `${d.clause} ${d.message}`.trim()).filter(Boolean).join(" ; ");
      f.statut = "bloquant";
      f.message = `PDF/A-${pdfA3.flavour} non conforme (veraPDF : ${pdfA3.failed} échec(s))${detail ? ` — ${detail}` : ""}.`;
    }
    f.origine = "verapdf";
    f.source = `${f.source ?? ""}${f.source ? " " : ""}Validation ISO 19005-3 par veraPDF.`.trim();
  }
  recalculer(report, true);
}

function statutDepuis(
  severite: Severite,
  applicable: boolean,
  passed: boolean,
): StatutFinding {
  if (!applicable) return "non_applicable";
  if (passed) return "reussi";
  return severite; // "bloquant" | "avertissement"
}

/** Applique toutes les règles à une facture déjà parsée. */
export function evaluer(inv: ParsedInvoice): Report {
  const findings: Finding[] = [];
  const counts: ReportCounts = {
    reussi: 0,
    avertissement: 0,
    bloquant: 0,
    nonApplicable: 0,
  };
  let poidsTotal = 0;
  let poidsReussi = 0;
  let contientReglesAVerifier = false;
  let exhaustif = true;

  for (const regle of REGLES) {
    const fn = checks[regle.id];
    const res = fn ? fn(inv) : { applicable: false, passed: false };
    const statut = statutDepuis(regle.severite, res.applicable, res.passed);

    if (statut === "reussi") counts.reussi++;
    else if (statut === "avertissement") counts.avertissement++;
    else if (statut === "bloquant") counts.bloquant++;
    else counts.nonApplicable++;

    if (res.applicable) {
      poidsTotal += POIDS[regle.severite];
      if (res.passed) poidsReussi += POIDS[regle.severite];
    }
    if (regle.aVerifier && res.applicable) contientReglesAVerifier = true;
    if (res.applicable && regle.exhaustif === false) exhaustif = false;

    const message =
      statut === "reussi"
        ? res.detail ?? regle.messageOk
        : statut === "non_applicable"
          ? "Non applicable à ce fichier."
          : res.detail ?? regle.libelle;

    findings.push({
      ruleId: regle.id,
      libelle: regle.libelle,
      categorie: regle.categorie,
      statut,
      message,
      commentCorriger: statut === "reussi" || statut === "non_applicable" ? null : regle.commentCorriger,
      infobulle: regle.infobulle,
      source: regle.source,
      aVerifier: regle.aVerifier,
      specId: regle.specId ?? null,
      origine: "moteur",
    });
  }

  const score = poidsTotal === 0 ? 0 : Math.round((poidsReussi / poidsTotal) * 100);
  const conforme = counts.bloquant === 0 && inv.erreurParsing == null;

  return {
    format: inv.format,
    profilFacturx: inv.profilFacturx,
    score,
    conforme,
    exhaustif,
    counts,
    findings,
    contientReglesAVerifier,
    erreurParsing: inv.erreurParsing,
    genereLe: new Date().toISOString(),
  };
}

/**
 * Contrôle d'unicité du numéro dans un lot (FC-M01) : marque en bloquant toute
 * facture dont le numéro apparaît sur plusieurs factures du même lot.
 * Mute les rapports passés en argument.
 */
export function marquerUniciteLot(
  items: { numero: string | null; report: Report }[],
): void {
  const comptes = new Map<string, number>();
  for (const it of items) {
    const n = it.numero?.trim();
    if (n) comptes.set(n, (comptes.get(n) ?? 0) + 1);
  }
  for (const it of items) {
    const n = it.numero?.trim();
    if (!n || (comptes.get(n) ?? 0) <= 1) continue;
    it.report.findings.push({
      ruleId: "NUM-003",
      libelle: "Numéro de facture unique dans le lot",
      categorie: "numerotation",
      statut: "bloquant",
      message: `Le numéro « ${n} » apparaît sur plusieurs factures du lot.`,
      commentCorriger:
        "Chaque facture doit porter un numéro unique. Corrigez les doublons avant transmission.",
      infobulle: "La numérotation doit être unique, continue et sans trou.",
      source: "CGI art. 242 nonies A — numéro unique.",
      aVerifier: true,
      specId: "FC-M01",
      origine: "moteur",
    });
    it.report.counts.bloquant += 1;
    it.report.conforme = false;
    it.report.score = Math.max(0, it.report.score - 12);
  }
}

/** Pipeline synchrone (moteur métier uniquement). */
export function analyserFichier(fichier: EntreeFichier): {
  parsed: ParsedInvoice;
  report: Report;
} {
  const parsed = parseInvoice(fichier);
  return { parsed, report: evaluer(parsed) };
}

/**
 * Pipeline complet : moteur métier + validation Schematron (contrôles officiels).
 * La conformité globale intègre les bloquants Schematron.
 */
export async function analyserFichierComplet(fichier: EntreeFichier): Promise<{
  parsed: ParsedInvoice;
  report: Report;
}> {
  const parsed = parseInvoice(fichier);
  const report = evaluer(parsed);

  // Contrôles officiels (Schematron) et validation PDF/A-3 (veraPDF) en parallèle.
  const [schematron, pdfA3] = await Promise.all([
    validerSchematron(parsed.xmlSource, parsed.format),
    parsed.pdf.estPdf ? validerPdfA3(fichier.bytes) : Promise.resolve(null),
  ]);

  // 1) PDF/A-3 d'abord : surcharge PDF-001 et recalcule score/conformité/exhaustivité.
  if (pdfA3) appliquerPdfA3(report, pdfA3);

  // 2) Schematron ensuite : pénalité de score et conformité par-dessus.
  report.schematron = schematron;
  if (schematron.execute) {
    const avert = schematron.findings.length - schematron.bloquants;
    report.score = Math.max(0, report.score - schematron.bloquants * 12 - avert * 2);
    if (schematron.bloquants > 0) report.conforme = false;
  }
  return { parsed, report };
}
