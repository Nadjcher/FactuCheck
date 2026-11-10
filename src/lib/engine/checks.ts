// Implémentation technique de chaque règle, associée par son `id`.
// Les métadonnées (libellé, sévérité, source, « à vérifier ») vivent dans
// `rules/*.json`. Ici vit UNIQUEMENT la logique de contrôle.
import type { CheckFn, ParsedInvoice } from "./types";
import { PROFILS_ACCEPTES } from "./types";
import { formaterEuro } from "../format";

const ok = (detail?: string) => ({ applicable: true, passed: true, detail });
const ko = (detail?: string) => ({ applicable: true, passed: false, detail });
const na = () => ({ applicable: false, passed: false });

/** Clé de contrôle Luhn (SIREN à 9 chiffres). */
function luhnValide(num: string): boolean {
  let somme = 0;
  for (let i = 0; i < num.length; i++) {
    let d = num.charCodeAt(num.length - 1 - i) - 48;
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    somme += d;
  }
  return somme % 10 === 0;
}

function sirenValide(s: string | null): boolean {
  if (!s) return false;
  const n = s.replace(/\s/g, "");
  return /^\d{9}$/.test(n) && luhnValide(n);
}

/** Date AAAAMMJJ ou ISO ; valide et non située dans le futur. */
function dateValideEtPassee(s: string | null): boolean {
  if (!s) return false;
  const compact = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const parts = compact ?? iso;
  if (!parts) return false;
  const y = +parts[1];
  const m = +parts[2];
  const d = +parts[3];
  const dt = new Date(Date.UTC(y, m - 1, d));
  const reelle =
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d;
  if (!reelle) return false;
  // tolérance : fin de journée courante
  return dt.getTime() <= Date.now() + 24 * 3600 * 1000;
}

const montantsPresents = (inv: ParsedInvoice) =>
  inv.montantHT != null && inv.montantTVA != null && inv.montantTTC != null;

/** Compare deux libellés de profil (tolérant à la casse / ponctuation). */
function profilsEgaux(a: string, b: string): boolean {
  const n = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const x = n(a);
  const y = n(b);
  return x === y || x.startsWith(y) || y.startsWith(x);
}

export const checks: Record<string, CheckFn> = {
  // --- Format -------------------------------------------------------------
  "FMT-001": (inv) =>
    inv.format !== "INCONNU"
      ? ok(`Format détecté : ${inv.format}.`)
      : ko("Aucun format de facture électronique reconnu."),

  "FMT-002": (inv) => {
    if (inv.format === "UBL") return na();
    return inv.profilFacturx
      ? ok(`Profil : ${inv.profilFacturx}.`)
      : ko("Profil Factur-X non identifié.");
  },

  // Piège fréquent : un fichier correct en BASIC est refusé par la plateforme
  // car seuls EN 16931 et EXTENDED-CTC-FR passent les contrôles.
  "FMT-003": (inv) => {
    if (inv.format === "UBL") return na();
    if (!inv.profilFacturx) return na();
    return PROFILS_ACCEPTES.includes(inv.profilFacturx)
      ? ok(`Profil accepté : ${inv.profilFacturx}.`)
      : ko(
          `Le profil « ${inv.profilFacturx} » est généralement refusé par les plateformes. Utilisez EN 16931 ou EXTENDED-CTC-FR.`,
        );
  },

  "FMT-004": (inv) => {
    if (!inv.pdf.estPdf) return na();
    return inv.pdf.versionFacturx
      ? ok(`Version Factur-X : ${inv.pdf.versionFacturx}.`)
      : ko("Version Factur-X non déclarée dans les métadonnées XMP.");
  },

  // Structure conforme à la syntaxe (éléments obligatoires présents).
  // Complément du contrôle « bien formé » (FMT-001) ; la validation XSD complète
  // reste à brancher (schémas officiels + validateur).
  "FMT-005": (inv) =>
    inv.format === "INCONNU"
      ? na()
      : inv.structureValide
        ? ok()
        : ko("Des éléments structurels obligatoires de la syntaxe sont manquants."),

  // --- PDF / conteneur Factur-X ------------------------------------------
  "PDF-001": (inv) => {
    if (!inv.pdf.estPdf) return na();
    if (!inv.pdf.estPdfA3) return ko("Le PDF ne se déclare pas conforme PDF/A-3.");
    return inv.pdf.pdfaConformance
      ? ok(`PDF/A-3${inv.pdf.pdfaConformance} déclaré.`)
      : ok("PDF/A-3 déclaré (niveau de conformité non précisé).");
  },

  "PDF-002": (inv) =>
    !inv.pdf.estPdf
      ? na()
      : inv.pdf.aXmlEmbarque
        ? ok()
        : ko("Aucun XML embarqué détecté dans le PDF."),

  "PDF-003": (inv) => {
    if (!inv.pdf.estPdf || !inv.pdf.aXmlEmbarque) return na();
    const nom = inv.pdf.nomXmlEmbarque?.toLowerCase() ?? null;
    return nom === "factur-x.xml"
      ? ok()
      : ko(`Fichier embarqué nommé « ${inv.pdf.nomXmlEmbarque ?? "inconnu"} ».`);
  },

  "PDF-004": (inv) => {
    if (!inv.pdf.estPdf) return na();
    if (!inv.pdf.aXmp) return ko("Aucune métadonnée XMP détectée.");
    const xmp = inv.pdf.conformanceLevelXmp;
    const xml = inv.profilFacturx;
    if (!xmp || !xml) return ok("Métadonnées XMP présentes.");
    return profilsEgaux(xmp, xml)
      ? ok(`Le XMP et le XML déclarent le même profil (${xml}).`)
      : ko(`Le profil déclaré dans le XMP (${xmp}) diffère de celui du XML (${xml}).`);
  },

  // --- Mentions obligatoires ---------------------------------------------
  "MEN-001": (inv) =>
    sirenValide(inv.emetteur.siren)
      ? ok(`SIREN émetteur : ${inv.emetteur.siren}.`)
      : ko(
          inv.emetteur.siren
            ? `SIREN émetteur invalide : « ${inv.emetteur.siren} ».`
            : "SIREN de l'émetteur absent.",
        ),

  "MEN-002": (inv) =>
    sirenValide(inv.client.siren)
      ? ok(`SIREN client : ${inv.client.siren}.`)
      : ko(
          inv.client.siren
            ? `SIREN client invalide : « ${inv.client.siren} ».`
            : "SIREN du client absent.",
        ),

  "MEN-003": (inv) =>
    inv.emetteur.numeroTVA
      ? ok(`N° TVA émetteur : ${inv.emetteur.numeroTVA}.`)
      : ko("Numéro de TVA de l'émetteur absent."),

  "MEN-004": (inv) =>
    inv.adresseLivraisonPresente ? ok() : ko("Aucune adresse de livraison renseignée."),

  "MEN-005": (inv) =>
    inv.natureOperation ? ok() : ko("Catégorie de l'opération non renseignée."),

  // BT-8 : code d'exigibilité de la TVA (option « sur les débits »). Optionnel :
  // non applicable s'il est absent, sinon on confirme sa présence.
  "MEN-007": (inv) =>
    inv.vatPointDateCode
      ? ok(`Code d'exigibilité TVA (BT-8) : ${inv.vatPointDateCode}.`)
      : na(),

  "MEN-008": (inv) =>
    inv.conditionsPaiement
      ? ok()
      : ko("Ni date d'échéance ni conditions de paiement."),

  // Applicable uniquement à un avoir (type 381).
  "MEN-009": (inv) => {
    if (inv.typeCode !== "381") return na();
    return inv.referenceOrigine
      ? ok(`Facture d'origine : ${inv.referenceOrigine}.`)
      : ko("Avoir sans référence à la facture d'origine.");
  },

  // Applicable seulement si l'opération semble exonérée (TVA = 0).
  "MEN-006": (inv) => {
    if (inv.montantTVA == null || inv.montantTVA > 0) return na();
    const ref = inv.natureOperation ?? "";
    const aReference =
      /exonér|franchise|art(icle|\.)\s*\d|tva\s*non\s*applicable|directive/i.test(ref);
    return aReference
      ? ok("Référence d'exonération détectée.")
      : ko("Opération exonérée (TVA = 0) sans référence légale visible.");
  },

  // --- Montants -----------------------------------------------------------
  "MNT-001": (inv) => {
    if (!montantsPresents(inv)) return na();
    const ht = inv.montantHT!;
    const tva = inv.montantTVA!;
    const ttc = inv.montantTTC!;
    const ecart = Math.abs(ht + tva - ttc);
    return ecart <= 0.01
      ? ok(`${formaterEuro(ht)} + ${formaterEuro(tva)} = ${formaterEuro(ttc)}.`)
      : ko(
          `${formaterEuro(ht)} + ${formaterEuro(tva)} = ${formaterEuro(ht + tva)} ≠ TTC ${formaterEuro(ttc)} (écart ${formaterEuro(ecart)}).`,
        );
  },

  "MNT-002": (inv) =>
    inv.montantTTC != null
      ? ok(`Total TTC : ${formaterEuro(inv.montantTTC)}.`)
      : ko("Montant TTC absent."),

  "MNT-003": (inv) => {
    const vals = [inv.montantHT, inv.montantTVA, inv.montantTTC].filter(
      (v): v is number => v != null,
    );
    if (vals.length === 0) return na();
    return vals.every((v) => v >= 0) ? ok() : ko("Au moins un montant est négatif.");
  },

  "MEN-010": (inv) => {
    if (inv.lignes.length === 0) return na();
    const incompletes = inv.lignes.filter(
      (l) => !l.designation || l.quantite == null || l.prixUnitaire == null || l.tauxTVA == null,
    );
    return incompletes.length === 0
      ? ok(`${inv.lignes.length} ligne(s) complète(s).`)
      : ko(`${incompletes.length} ligne(s) incomplète(s) : désignation, quantité, prix ou taux manquant.`);
  },

  "MNT-005": (inv) => {
    const verifiables = inv.lignes.filter(
      (l) => !l.aRemiseCharge && l.quantite != null && l.prixUnitaire != null && l.montantNet != null,
    );
    if (verifiables.length === 0) return na();
    const faux = verifiables.filter(
      (l) => Math.abs((l.montantNet as number) - (l.quantite as number) * (l.prixUnitaire as number)) > 0.01,
    );
    return faux.length === 0
      ? ok()
      : ko(`${faux.length} ligne(s) : montant net ≠ quantité × prix unitaire.`);
  },

  "MNT-004": (inv) => {
    if (inv.montantDu == null || inv.montantTTC == null) return na();
    const acomptes = inv.acomptes ?? 0;
    const attendu = inv.montantTTC - acomptes;
    return Math.abs(inv.montantDu - attendu) <= 0.01
      ? ok(`Net à payer : ${formaterEuro(inv.montantDu)}.`)
      : ko(
          `Net à payer ${formaterEuro(inv.montantDu)} ≠ TTC ${formaterEuro(inv.montantTTC)} − acomptes ${formaterEuro(acomptes)} = ${formaterEuro(attendu)}.`,
        );
  },

  // --- Dates & numérotation ----------------------------------------------
  "DAT-001": (inv) =>
    inv.dateEmission ? ok() : ko("Date d'émission absente."),

  "DAT-002": (inv) => {
    if (!inv.dateEmission) return na();
    return dateValideEtPassee(inv.dateEmission)
      ? ok()
      : ko(`Date d'émission invalide ou future : « ${inv.dateEmission} ».`);
  },

  "NUM-001": (inv) =>
    inv.numero && inv.numero.trim() !== ""
      ? ok(`Numéro : ${inv.numero}.`)
      : ko("Numéro de facture absent."),

  "NUM-002": (inv) => {
    if (!inv.numero) return na();
    const propre =
      inv.numero.trim() === inv.numero &&
      inv.numero.length > 0 &&
      !/[\\/<>]/.test(inv.numero);
    return propre ? ok() : ko("Le numéro contient des caractères ou espaces problématiques.");
  },
};
