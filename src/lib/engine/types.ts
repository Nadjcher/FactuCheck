// ----------------------------------------------------------------------------
// Types du moteur de contrôle FactuCheck.
// Le moteur est totalement indépendant de l'UI et de la base de données :
// il prend un fichier en entrée et produit un Rapport.
// ----------------------------------------------------------------------------

export type Severite = "bloquant" | "avertissement";

export type StatutFinding =
  | "reussi"
  | "avertissement"
  | "bloquant"
  | "non_applicable";

export type Categorie =
  | "format"
  | "pdf"
  | "mentions"
  | "montants"
  | "dates"
  | "numerotation";

export type FormatFacture = "FACTURX_PDF" | "UBL" | "CII" | "INCONNU";

export type ProfilFacturx =
  | "MINIMUM"
  | "BASIC WL"
  | "BASIC"
  | "EN 16931"
  | "EXTENDED"
  | null;

/** Règle déclarative, chargée depuis `rules/*.json`. */
export interface RuleDefinition {
  id: string;
  libelle: string;
  categorie: Categorie;
  severite: Severite;
  /** Référence officielle. `null` tant que non vérifiée. */
  source: string | null;
  /** `true` tant que la source n'est pas confirmée → badge « À VÉRIFIER ». */
  aVerifier: boolean;
  messageOk: string;
  commentCorriger: string;
  infobulle: string;
}

/** Métadonnées propres au conteneur PDF (Factur-X). */
export interface PdfMeta {
  estPdf: boolean;
  estPdfA3: boolean;
  aXmlEmbarque: boolean;
  nomXmlEmbarque: string | null;
  aXmp: boolean;
}

/** Partie (émetteur ou client). */
export interface Partie {
  nom: string | null;
  siren: string | null;
  numeroTVA: string | null;
}

/** Modèle normalisé de facture, produit par les parsers. */
export interface ParsedInvoice {
  format: FormatFacture;
  profilFacturx: ProfilFacturx;
  numero: string | null;
  dateEmission: string | null; // brut, tel que lu (souvent AAAAMMJJ)
  emetteur: Partie;
  client: Partie;
  adresseLivraisonPresente: boolean;
  natureOperation: string | null;
  montantHT: number | null;
  montantTVA: number | null;
  montantTTC: number | null;
  pdf: PdfMeta;
  /** Erreur de parsing éventuelle (fichier illisible, XML invalide...). */
  erreurParsing: string | null;
}

/** Résultat d'un contrôle individuel. */
export interface CheckResult {
  applicable: boolean;
  passed: boolean;
  /** Détail dynamique optionnel (ex. « HT 100,00 + TVA 20,00 ≠ TTC 125,00 »). */
  detail?: string;
}

/** Fonction de contrôle associée à une règle par son id. */
export type CheckFn = (inv: ParsedInvoice) => CheckResult;

/** Ligne de résultat pour une règle dans le rapport final. */
export interface Finding {
  ruleId: string;
  libelle: string;
  categorie: Categorie;
  statut: StatutFinding;
  message: string;
  commentCorriger: string | null;
  infobulle: string;
  source: string | null;
  aVerifier: boolean;
}

export interface ReportCounts {
  reussi: number;
  avertissement: number;
  bloquant: number;
  nonApplicable: number;
}

/** Rapport complet produit par le moteur. */
export interface Report {
  format: FormatFacture;
  profilFacturx: ProfilFacturx;
  score: number; // 0..100
  conforme: boolean; // aucun contrôle bloquant en échec
  counts: ReportCounts;
  findings: Finding[];
  /** Vrai si au moins une règle évaluée est encore « À VÉRIFIER ». */
  contientReglesAVerifier: boolean;
  erreurParsing: string | null;
  genereLe: string; // ISO
}
