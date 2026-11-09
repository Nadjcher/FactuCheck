// Parser CII / Factur-X (UN/CEFACT CrossIndustryInvoice).
import type { ParsedInvoice, Partie, ProfilFacturx } from "../types";
import { get, text, textAt, toNumber } from "../xml";

function asArray(v: unknown): unknown[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function schemeId(node: unknown): string | null {
  if (node && typeof node === "object") {
    const s = (node as Record<string, unknown>)["@_schemeID"];
    if (s != null) return String(s);
  }
  return null;
}

/** Trouve l'immatriculation TVA (schemeID "VA") parmi SpecifiedTaxRegistration. */
function findVat(party: unknown): string | null {
  const regs = asArray(get(party, "SpecifiedTaxRegistration"));
  for (const r of regs) {
    const id = get(r, "ID");
    if (schemeId(id) === "VA") return text(id);
  }
  // Repli : premier ID présent.
  return regs.length ? text(get(regs[0], "ID")) : null;
}

function parseParty(party: unknown): Partie {
  return {
    nom: textAt(party, "Name"),
    siren: textAt(party, "SpecifiedLegalOrganization.ID"),
    numeroTVA: findVat(party),
  };
}

function detectProfil(urn: string | null): ProfilFacturx {
  if (!urn) return null;
  const u = urn.toLowerCase();
  // L'ordre compte : les profils les plus spécifiques d'abord.
  if (u.includes("minimum")) return "MINIMUM";
  if (u.includes("basicwl")) return "BASIC WL";
  if (u.includes("basic")) return "BASIC";
  if (u.includes("extended")) {
    // Profil français CTC (EXTENDED-CTC-FR) vs EXTENDED standard.
    return u.includes("ctc") ? "EXTENDED-CTC-FR" : "EXTENDED";
  }
  if (u.includes("en16931") || u.includes("compliant")) return "EN 16931";
  return null;
}

export function parseCII(
  root: Record<string, unknown>,
  formatPdf: boolean,
): Omit<ParsedInvoice, "pdf" | "erreurParsing"> {
  const inv = get(root, "CrossIndustryInvoice");
  const ctxUrn = textAt(
    inv,
    "ExchangedDocumentContext.GuidelineSpecifiedDocumentContextParameter.ID",
  );
  const doc = get(inv, "ExchangedDocument");
  const tx = get(inv, "SupplyChainTradeTransaction");
  const agreement = get(tx, "ApplicableHeaderTradeAgreement");
  const delivery = get(tx, "ApplicableHeaderTradeDelivery");
  const settlement = get(tx, "ApplicableHeaderTradeSettlement");
  const sums = get(
    settlement,
    "SpecifiedTradeSettlementHeaderMonetarySummation",
  );

  const dateRaw =
    textAt(doc, "IssueDateTime.DateTimeString") ??
    textAt(doc, "IssueDateTime");

  const noteTexte = asArray(get(doc, "IncludedNote"))
    .map((n) => text(get(n, "Content")))
    .filter(Boolean)
    .join(" ");

  return {
    format: formatPdf ? "FACTURX_PDF" : "CII",
    profilFacturx: detectProfil(ctxUrn),
    numero: textAt(doc, "ID"),
    dateEmission: dateRaw,
    emetteur: parseParty(get(agreement, "SellerTradeParty")),
    client: parseParty(get(agreement, "BuyerTradeParty")),
    adresseLivraisonPresente:
      get(delivery, "ShipToTradeParty.PostalTradeAddress") != null,
    natureOperation: noteTexte || null,
    montantHT: toNumber(textAt(sums, "TaxBasisTotalAmount")),
    montantTVA: toNumber(textAt(sums, "TaxTotalAmount")),
    montantTTC:
      toNumber(textAt(sums, "GrandTotalAmount")) ??
      toNumber(textAt(sums, "DuePayableAmount")),
  };
}
