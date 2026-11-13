// Schéma de réponse PUBLIC de l'API : stable et indépendant des structures
// internes du moteur. C'est le contrat exposé aux intégrateurs.
import type { Report } from "@/lib/engine";

export type Verdict = "conforme" | "partiel" | "non_conforme";

export interface PointACorriger {
  /** Identifiant de spécification (FC-…) ou de règle (BR-…), si disponible. */
  code: string | null;
  /** Libellé lisible de la règle. */
  regle: string;
  /** Ce qui ne va pas, en français. */
  probleme: string;
  /** Comment corriger (null si non applicable). */
  corriger: string | null;
  severite: "bloquant" | "avertissement";
  source: "moteur" | "schematron" | "verapdf" | "xsd";
}

export interface ReponsePublique {
  /** Verdict global prêt à afficher. */
  verdict: Verdict;
  /** Aucun contrôle bloquant en échec. */
  conforme: boolean;
  /** Contrôle complet (false = « contrôle partiel », ex. PDF/A-3 non vérifié). */
  exhaustif: boolean;
  /** Score de conformité 0–100. */
  score: number;
  /** Format détecté : CII, UBL, FACTURX_PDF ou INCONNU. */
  format: string;
  /** Profil Factur-X (EN 16931, EXTENDED-CTC-FR…) ou null. */
  profil: string | null;
  resume: { reussis: number; avertissements: number; bloquants: number };
  /** Points à corriger / points d'attention, prêts à afficher. */
  aCorriger: PointACorriger[];
  /** Erreur de lecture du fichier (null si lisible). */
  erreur: string | null;
  /** Nom du fichier analysé, si fourni. */
  fichier?: string;
  genereLe: string;
}

export function versReponsePublique(report: Report, fichier?: string): ReponsePublique {
  const verdict: Verdict = !report.conforme ? "non_conforme" : report.exhaustif ? "conforme" : "partiel";

  const sch = report.schematron?.execute ? report.schematron.findings : [];
  const items = [...report.findings, ...sch].filter(
    (f) => f.statut === "bloquant" || f.statut === "avertissement",
  );
  const aCorriger: PointACorriger[] = items.map((f) => ({
    code: f.specId ?? (f.ruleId.startsWith("BR") ? f.ruleId : null),
    regle: f.libelle,
    probleme: f.message,
    corriger: f.commentCorriger ?? null,
    severite: f.statut as "bloquant" | "avertissement",
    source: f.origine,
  }));

  return {
    verdict,
    conforme: report.conforme,
    exhaustif: report.exhaustif,
    score: report.score,
    format: report.format,
    profil: report.profilFacturx,
    resume: {
      reussis: report.counts.reussi,
      avertissements: report.counts.avertissement,
      bloquants: report.counts.bloquant,
    },
    aCorriger,
    erreur: report.erreurParsing,
    ...(fichier ? { fichier } : {}),
    genereLe: report.genereLe,
  };
}
