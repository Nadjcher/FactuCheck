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
  | "EXTENDED-CTC-FR"
  | null;

/** Profils acceptés par les plateformes agréées (contrôle FMT-003). */
export const PROFILS_ACCEPTES: ProfilFacturx[] = ["EN 16931", "EXTENDED-CTC-FR"];

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
  /** Identifiant de la règle correspondante dans la spécification (FC-…). */
  specId?: string | null;
  /**
   * `false` quand le contrôle n'est que partiel / best-effort (ex. PDF/A-3 ou
   * XSD non validés exhaustivement). Rend le verdict global « partiel ».
   */
  exhaustif?: boolean;
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
  /** Version Factur-X déclarée dans les métadonnées XMP (ex. « 1.0 »). */
  versionFacturx: string | null;
  /** Lettre de conformité PDF/A déclarée (A, B ou U), ou null. */
  pdfaConformance: string | null;
  /** Niveau de conformité Factur-X déclaré dans le XMP (fx:ConformanceLevel). */
  conformanceLevelXmp: string | null;
}

/** Partie (émetteur ou client). */
export interface Partie {
  nom: string | null;
  siren: string | null;
  numeroTVA: string | null;
}

/** Ligne de facture. */
export interface LigneFacture {
  id: string | null;
  designation: string | null;
  quantite: number | null;
  prixUnitaire: number | null;
  tauxTVA: number | null;
  montantNet: number | null;
  /** Remise ou frais au niveau ligne (le net ≠ quantité × prix). */
  aRemiseCharge: boolean;
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
  /** Net à payer (BT-115) : DuePayableAmount / PayableAmount. */
  montantDu: number | null;
  /** Acomptes déjà versés (BT-113) : TotalPrepaidAmount / PrepaidAmount. */
  acomptes: number | null;
  /** Code type de document (BT-3) : 380 facture, 381 avoir. */
  typeCode: string | null;
  /** Référence à la facture d'origine (avoir / rectificative). */
  referenceOrigine: string | null;
  /** Échéance ou conditions de paiement présentes. */
  conditionsPaiement: boolean;
  /** BT-8 : code d'exigibilité de la TVA (option « TVA sur les débits »). */
  vatPointDateCode: string | null;
  /** Lignes de facture extraites. */
  lignes: LigneFacture[];
  /** Les éléments structurels obligatoires de la syntaxe sont présents. */
  structureValide: boolean;
  pdf: PdfMeta;
  /** XML brut utilisé (pour la validation Schematron) ; null si indisponible. */
  xmlSource: string | null;
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

/** Origine d'un résultat : moteur « métier », Schematron, ou validation PDF/A (veraPDF). */
export type OrigineFinding = "moteur" | "schematron" | "verapdf";

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
  /** Identifiant de la règle correspondante dans la spécification (FC-…). */
  specId?: string | null;
  origine: OrigineFinding;
}

/** Résultat de la validation Schematron (contrôles officiels). */
export interface SchematronResultat {
  execute: boolean; // la validation a-t-elle pu s'exécuter ?
  moteur: string; // ex. "node-schematron"
  source: string; // ex. "FactuCheck CII (maison)" ou "EN16931-CII (officiel)"
  findings: Finding[]; // uniquement les anomalies (asserts en échec / reports)
  bloquants: number;
  note: string | null; // diagnostic (ex. aucun schematron pour ce format)
}

/** Résultat de la validation PDF/A-3 complète par le service veraPDF (ISO 19005-3). */
export interface PdfA3Resultat {
  /** La validation a-t-elle pu s'exécuter (service configuré et joignable) ? */
  execute: boolean;
  moteur: "veraPDF";
  /** Profil PDF/A visé (ex. « 3b »). */
  flavour: string;
  /** Conforme PDF/A-3 ? `null` si non exécuté. */
  conforme: boolean | null;
  passed: number;
  failed: number;
  /** Jusqu'à quelques règles ISO 19005-3 en échec (clause + message). */
  details: Array<{ clause: string; message: string }>;
  /** Diagnostic (service non configuré, injoignable, version…). */
  note: string | null;
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
  /**
   * `false` si au moins un contrôle applicable n'est que partiel (PDF/A-3, XSD).
   * Un rapport conforme mais non exhaustif est présenté « Contrôle partiel ».
   */
  exhaustif: boolean;
  counts: ReportCounts;
  findings: Finding[];
  /** Vrai si au moins une règle évaluée est encore « À VÉRIFIER ». */
  contientReglesAVerifier: boolean;
  erreurParsing: string | null;
  /** Résultat de la validation Schematron, si exécutée. */
  schematron?: SchematronResultat;
  /** Résultat de la validation PDF/A-3 (service veraPDF), si exécutée. */
  pdfA3?: PdfA3Resultat;
  genereLe: string; // ISO
}
