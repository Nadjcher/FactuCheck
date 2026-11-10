// Point d'entrée du parsing : détecte le format et produit un ParsedInvoice.
import type { ParsedInvoice, PdfMeta } from "./types";
import { parseXml } from "./xml";
import { parseCII } from "./formats/cii";
import { parseUBL } from "./formats/ubl";
import { extractFromPdf } from "./formats/pdf";

const PDF_META_VIDE: PdfMeta = {
  estPdf: false,
  estPdfA3: false,
  aXmlEmbarque: false,
  nomXmlEmbarque: null,
  aXmp: false,
};

function invoiceVide(
  erreur: string,
  pdf: PdfMeta = PDF_META_VIDE,
  xmlSource: string | null = null,
): ParsedInvoice {
  return {
    format: "INCONNU",
    profilFacturx: null,
    numero: null,
    dateEmission: null,
    emetteur: { nom: null, siren: null, numeroTVA: null },
    client: { nom: null, siren: null, numeroTVA: null },
    adresseLivraisonPresente: false,
    natureOperation: null,
    montantHT: null,
    montantTVA: null,
    montantTTC: null,
    pdf,
    xmlSource,
    erreurParsing: erreur,
  };
}

function parseXmlString(xml: string, pdf: PdfMeta): ParsedInvoice {
  let root: Record<string, unknown>;
  try {
    root = parseXml(xml);
  } catch (e) {
    return invoiceVide(
      `XML illisible : ${(e as Error).message}`,
      pdf,
    );
  }

  const keys = Object.keys(root);
  const isCII = keys.includes("CrossIndustryInvoice");
  const isUBL = keys.includes("Invoice") || keys.includes("CreditNote");

  if (isCII) {
    return {
      ...parseCII(root, pdf.estPdf),
      pdf,
      xmlSource: xml,
      erreurParsing: null,
    };
  }
  if (isUBL) {
    return { ...parseUBL(root), pdf, xmlSource: xml, erreurParsing: null };
  }
  return invoiceVide(
    "Racine XML non reconnue (ni CrossIndustryInvoice, ni Invoice/CreditNote).",
    pdf,
    xml,
  );
}

export interface EntreeFichier {
  nom: string;
  bytes: Buffer;
}

export function parseInvoice(fichier: EntreeFichier): ParsedInvoice {
  const { bytes } = fichier;
  const estPdf = bytes.subarray(0, 5).toString("latin1").startsWith("%PDF");

  if (estPdf) {
    const { pdf, xml } = extractFromPdf(bytes);
    if (!xml) {
      // Conteneur PDF détecté mais pas de XML exploitable.
      return {
        ...invoiceVide(
          "Aucun XML de facture exploitable n'a pu être extrait du PDF.",
          pdf,
        ),
        format: "FACTURX_PDF",
      };
    }
    return parseXmlString(xml, pdf);
  }

  // Fichier XML pur
  const text = bytes.toString("utf8").replace(/^﻿/, "");
  return parseXmlString(text, PDF_META_VIDE);
}
