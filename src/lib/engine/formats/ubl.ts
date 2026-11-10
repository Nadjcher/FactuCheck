// Parser UBL (OASIS Universal Business Language, Invoice-2).
import type { LigneFacture, ParsedInvoice, Partie } from "../types";
import { get, text, textAt, toNumber } from "../xml";

function asArray(v: unknown): unknown[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function parseParty(party: unknown): Partie {
  // SIREN : PartyLegalEntity/CompanyID
  const siren = textAt(party, "PartyLegalEntity.CompanyID");
  // TVA : PartyTaxScheme/CompanyID (schéma TVA)
  const taxSchemes = asArray(get(party, "PartyTaxScheme"));
  let numeroTVA: string | null = null;
  for (const ts of taxSchemes) {
    const id = text(get(ts, "CompanyID"));
    if (id) {
      numeroTVA = id;
      break;
    }
  }
  const nom =
    textAt(party, "PartyName.Name") ??
    textAt(party, "PartyLegalEntity.RegistrationName");
  return { nom, siren, numeroTVA };
}

function parseLignes(inv: unknown): LigneFacture[] {
  const items = [
    ...asArray(get(inv, "InvoiceLine")),
    ...asArray(get(inv, "CreditNoteLine")),
  ];
  return items.map((li) => ({
    id: textAt(li, "ID"),
    designation: textAt(li, "Item.Name"),
    quantite: toNumber(textAt(li, "InvoicedQuantity") ?? textAt(li, "CreditedQuantity")),
    prixUnitaire: toNumber(textAt(li, "Price.PriceAmount")),
    tauxTVA: toNumber(textAt(li, "Item.ClassifiedTaxCategory.Percent")),
    montantNet: toNumber(textAt(li, "LineExtensionAmount")),
    aRemiseCharge: get(li, "AllowanceCharge") != null,
  }));
}

export function parseUBL(
  root: Record<string, unknown>,
): Omit<ParsedInvoice, "pdf" | "xmlSource" | "erreurParsing"> {
  const inv = get(root, "Invoice") ?? get(root, "CreditNote");

  const supplier = get(inv, "AccountingSupplierParty.Party");
  const customer = get(inv, "AccountingCustomerParty.Party");
  const totals = get(inv, "LegalMonetaryTotal");

  const tvaTotal = asArray(get(inv, "TaxTotal"))
    .map((t) => toNumber(text(get(t, "TaxAmount"))))
    .find((n) => n != null);

  const delivery = get(inv, "Delivery");

  return {
    format: "UBL",
    profilFacturx: null, // notion propre à Factur-X
    numero: textAt(inv, "ID"),
    dateEmission: textAt(inv, "IssueDate"),
    emetteur: parseParty(supplier),
    client: parseParty(customer),
    adresseLivraisonPresente: get(delivery, "DeliveryLocation") != null,
    natureOperation: textAt(inv, "Note"),
    montantHT: toNumber(textAt(totals, "TaxExclusiveAmount")),
    montantTVA: tvaTotal ?? null,
    montantTTC:
      toNumber(textAt(totals, "TaxInclusiveAmount")) ??
      toNumber(textAt(totals, "PayableAmount")),
    montantDu: toNumber(textAt(totals, "PayableAmount")),
    acomptes: toNumber(textAt(totals, "PrepaidAmount")),
    typeCode: textAt(inv, "InvoiceTypeCode") ?? textAt(inv, "CreditNoteTypeCode"),
    referenceOrigine: textAt(inv, "BillingReference.InvoiceDocumentReference.ID"),
    conditionsPaiement:
      get(inv, "PaymentTerms") != null ||
      textAt(inv, "PaymentMeans.PaymentDueDate") != null,
    // BT-8 : code d'exigibilité de la TVA (InvoicePeriod/DescriptionCode).
    vatPointDateCode: textAt(inv, "InvoicePeriod.DescriptionCode"),
    lignes: parseLignes(inv),
    structureValide:
      textAt(inv, "ID") != null &&
      supplier != null &&
      customer != null &&
      totals != null,
  };
}
