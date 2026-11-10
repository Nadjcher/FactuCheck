// Extraction best-effort du XML Factur-X embarqué dans un PDF/A-3, et détection
// des métadonnées du conteneur. Approche volontairement tolérante : on cherche
// d'abord le XML en clair, puis dans les flux compressés (FlateDecode).
import zlib from "node:zlib";
import type { PdfMeta } from "../types";

const INVOICE_ROOT = /<(?:\w+:)?(CrossIndustryInvoice|Invoice|CreditNote)\b/;

function tryInflate(buf: Buffer): string | null {
  for (const fn of [zlib.inflateSync, zlib.inflateRawSync] as const) {
    try {
      const out = fn(buf).toString("utf8");
      if (INVOICE_ROOT.test(out)) return out;
    } catch {
      // flux non compressé ou non pertinent : on ignore
    }
  }
  return null;
}

/** Récupère le bloc XML de facture d'un fragment texte, le cas échéant. */
function sliceInvoiceXml(s: string): string | null {
  const m = s.match(
    /<\?xml[\s\S]*?<(?:\w+:)?(CrossIndustryInvoice|Invoice|CreditNote)[\s\S]*?<\/(?:\w+:)?\1>/,
  );
  if (m) return m[0];
  const m2 = s.match(
    /<(?:\w+:)?(CrossIndustryInvoice|Invoice|CreditNote)[\s\S]*?<\/(?:\w+:)?\1>/,
  );
  return m2 ? m2[0] : null;
}

export function extractFromPdf(buf: Buffer): {
  pdf: PdfMeta;
  xml: string | null;
} {
  const latin1 = buf.toString("latin1");
  const estPdf = latin1.startsWith("%PDF");

  const aXmp = /<x:xmpmeta|<\?xpacket/.test(latin1);

  // Version Factur-X / ZUGFeRD déclarée dans les métadonnées XMP.
  const versionMatch =
    latin1.match(/<(?:fx|zf|rsm):Version>\s*([^<\s]+)\s*<\/(?:fx|zf|rsm):Version>/i) ||
    latin1.match(/fx:Version\s*=\s*"([^"]+)"/i);
  const versionFacturx = versionMatch ? versionMatch[1] : null;

  // Lettre de conformité PDF/A (A, B ou U).
  const confMatch =
    latin1.match(/<pdfaid:conformance>\s*([ABU])\s*<\/pdfaid:conformance>/i) ||
    latin1.match(/pdfaid:conformance\s*=\s*"([ABU])"/i);
  const pdfaConformance = confMatch ? confMatch[1].toUpperCase() : null;

  // Niveau de conformité Factur-X déclaré dans le XMP.
  const levelMatch =
    latin1.match(/<(?:fx|zf|rsm):ConformanceLevel>\s*([^<]+?)\s*<\/(?:fx|zf|rsm):ConformanceLevel>/i) ||
    latin1.match(/fx:ConformanceLevel\s*=\s*"([^"]+)"/i);
  const conformanceLevelXmp = levelMatch ? levelMatch[1].trim() : null;
  const estPdfA3 =
    /<pdfaid:part>\s*3\s*<\/pdfaid:part>/.test(latin1) ||
    /pdfaid:part\s*=\s*["']?3/.test(latin1);

  // Nom du fichier embarqué : /F (xxx.xml) ou /UF (xxx.xml), ou nom connu.
  let nomXmlEmbarque: string | null = null;
  const nameMatch = latin1.match(/\/U?F\s*\(([^)]*\.xml)\)/i);
  if (nameMatch) {
    nomXmlEmbarque = nameMatch[1].split(/[\\/]/).pop() ?? nameMatch[1];
  } else {
    const known = latin1.match(
      /(factur-x\.xml|zugferd-invoice\.xml|order-x\.xml|xrechnung\.xml)/i,
    );
    if (known) nomXmlEmbarque = known[1];
  }

  // 1) XML en clair dans le PDF
  let xml = sliceInvoiceXml(latin1);

  // 2) Sinon, on tente les flux compressés
  if (!xml) {
    const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let m: RegExpExecArray | null;
    while ((m = streamRe.exec(latin1)) !== null) {
      const start = m.index + m[0].indexOf("\n", 6) + 1;
      const end = m.index + m[0].length - "endstream".length;
      const raw = buf.subarray(start, end);
      const decoded = tryInflate(raw);
      if (decoded) {
        const found = sliceInvoiceXml(decoded);
        if (found) {
          xml = found;
          break;
        }
      }
    }
  }

  const aXmlEmbarque = xml != null || nomXmlEmbarque != null;

  return {
    pdf: {
      estPdf,
      estPdfA3,
      aXmlEmbarque,
      nomXmlEmbarque,
      aXmp,
      versionFacturx,
      pdfaConformance,
      conformanceLevelXmp,
    },
    xml,
  };
}
