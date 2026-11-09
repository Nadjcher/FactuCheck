// Charge le catalogue déclaratif depuis `rules/*.json`.
// L'ordre d'affichage suit l'ordre des fichiers puis des règles.
import type { RuleDefinition } from "./types";
import format from "../../../rules/format.json";
import pdfFacturx from "../../../rules/pdf-facturx.json";
import mentions from "../../../rules/mentions.json";
import montants from "../../../rules/montants.json";
import datesNum from "../../../rules/dates-numerotation.json";

interface FichierRegles {
  fichier: string;
  description: string;
  regles: RuleDefinition[];
}

const fichiers = [
  format,
  pdfFacturx,
  mentions,
  montants,
  datesNum,
] as unknown as FichierRegles[];

export const REGLES: RuleDefinition[] = fichiers.flatMap((f) => f.regles);

export const REGLES_PAR_ID: Map<string, RuleDefinition> = new Map(
  REGLES.map((r) => [r.id, r]),
);

export const CATALOGUE_FICHIERS = fichiers;
