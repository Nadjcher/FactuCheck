// Données de démonstration (mode sans base). En production, elles proviennent
// de Supabase (voir supabase/schema.sql).
import type { StatutFinding } from "./engine/types";

export interface DemoClient {
  id: string;
  nom: string;
  siren: string;
  facturesTestees: number;
  tauxConformite: number; // 0..100
}

export interface DemoFacture {
  id: string;
  nom: string;
  clientId: string;
  clientNom: string;
  format: string;
  score: number;
  statut: "conforme" | "non_conforme";
  date: string; // ISO
}

export interface DemoMembre {
  id: string;
  nom: string;
  email: string;
  role: "admin" | "collaborateur" | "client_lecture";
}

export const DEMO_CLIENTS: DemoClient[] = [
  { id: "c1", nom: "Boulangerie Martin", siren: "801234562", facturesTestees: 128, tauxConformite: 94 },
  { id: "c2", nom: "Atelier Dupont SARL", siren: "812345673", facturesTestees: 86, tauxConformite: 78 },
  { id: "c3", nom: "Conseil & Co", siren: "823456784", facturesTestees: 212, tauxConformite: 88 },
  { id: "c4", nom: "Transports Leroy", siren: "834567895", facturesTestees: 54, tauxConformite: 61 },
];

export const DEMO_FACTURES: DemoFacture[] = [
  { id: "f1", nom: "FA-2026-0148.pdf", clientId: "c1", clientNom: "Boulangerie Martin", format: "FACTURX_PDF", score: 100, statut: "conforme", date: "2026-11-08T09:12:00Z" },
  { id: "f2", nom: "FA-2026-0147.xml", clientId: "c2", clientNom: "Atelier Dupont SARL", format: "UBL", score: 67, statut: "non_conforme", date: "2026-11-08T08:40:00Z" },
  { id: "f3", nom: "INV-5521.xml", clientId: "c3", clientNom: "Conseil & Co", format: "CII", score: 92, statut: "conforme", date: "2026-11-07T17:22:00Z" },
  { id: "f4", nom: "FA-2026-0146.pdf", clientId: "c4", clientNom: "Transports Leroy", format: "FACTURX_PDF", score: 45, statut: "non_conforme", date: "2026-11-07T14:05:00Z" },
  { id: "f5", nom: "FA-2026-0145.pdf", clientId: "c1", clientNom: "Boulangerie Martin", format: "FACTURX_PDF", score: 100, statut: "conforme", date: "2026-11-06T11:30:00Z" },
  { id: "f6", nom: "INV-5519.xml", clientId: "c3", clientNom: "Conseil & Co", format: "CII", score: 83, statut: "conforme", date: "2026-11-05T10:15:00Z" },
];

export const DEMO_MEMBRES: DemoMembre[] = [
  { id: "m1", nom: "Vous", email: "vous@cabinet.fr", role: "admin" },
  { id: "m2", nom: "Camille Roux", email: "camille@cabinet.fr", role: "collaborateur" },
  { id: "m3", nom: "Boulangerie Martin", email: "contact@martin.fr", role: "client_lecture" },
];

// Top 5 des causes d'erreur (agrégé).
export const DEMO_TOP_CAUSES: { ruleId: string; libelle: string; statut: StatutFinding; occurrences: number }[] = [
  { ruleId: "MEN-002", libelle: "SIREN du client absent", statut: "bloquant", occurrences: 37 },
  { ruleId: "MNT-001", libelle: "Incohérence HT + TVA = TTC", statut: "bloquant", occurrences: 24 },
  { ruleId: "MEN-004", libelle: "Adresse de livraison absente", statut: "avertissement", occurrences: 19 },
  { ruleId: "PDF-003", libelle: "XML embarqué mal nommé", statut: "avertissement", occurrences: 12 },
  { ruleId: "DAT-002", libelle: "Date d'émission invalide", statut: "avertissement", occurrences: 8 },
];

// Évolution du taux de conformité (12 dernières semaines).
export const DEMO_EVOLUTION = [
  62, 65, 64, 70, 72, 71, 75, 78, 80, 83, 86, 88,
];

export const DEMO_STATS = {
  tauxConformite: 86,
  facturesTestees: 480,
  facturesCeMois: 142,
  quotaMois: 500,
};
