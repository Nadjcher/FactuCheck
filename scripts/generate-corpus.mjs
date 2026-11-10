// Génère le jeu de factures de test dans fixtures-corpus/ : une facture CII
// conforme, puis une facture invalide par règle (nommage KO_<specId>_<objet>),
// chacune produite par une mutation ciblée de la facture conforme.
// Écrit aussi manifest.json (fichier -> résultat attendu), lu par le test
// src/lib/engine/corpus.test.ts.
//
// Usage : node scripts/generate-corpus.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "fixtures-corpus");

const BASE = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>FA-2026-0001</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">20260115</udt:DateTimeString></ram:IssueDateTime>
    <ram:IncludedNote><ram:Content>Prestation de services de conseil</ram:Content></ram:IncludedNote>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>1</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>Prestation de conseil</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice><ram:ChargeAmount>1000.00</ram:ChargeAmount></ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>1000.00</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>Cabinet Demo SARL</ram:Name>
        <ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">123456782</ram:ID></ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress><ram:PostcodeCode>75001</ram:PostcodeCode><ram:LineOne>1 rue de la Paix</ram:LineOne><ram:CityName>Paris</ram:CityName><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">FR32123456782</ram:ID></ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Client Demo SAS</ram:Name>
        <ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">987654324</ram:ID></ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress><ram:PostcodeCode>69002</ram:PostcodeCode><ram:LineOne>2 avenue des Ventes</ram:LineOne><ram:CityName>Lyon</ram:CityName><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ShipToTradeParty><ram:PostalTradeAddress><ram:PostcodeCode>69002</ram:PostcodeCode><ram:LineOne>2 avenue des Ventes</ram:LineOne><ram:CityName>Lyon</ram:CityName><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress></ram:ShipToTradeParty>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>200.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>1000.00</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:DueDateTypeCode>5</ram:DueDateTypeCode>
        <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime><udt:DateTimeString format="102">20260214</udt:DateTimeString></ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>1000.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>1000.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">200.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>1200.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

/** Remplace une sous-chaîne unique, en vérifiant qu'elle existe. */
function muter(src, from, to) {
  if (!src.includes(from)) throw new Error(`Motif introuvable : ${from.slice(0, 40)}…`);
  return src.replace(from, to);
}

const CAS = [
  { nom: "OK_CII_conforme.xml", xml: BASE, attendu: { conforme: true } },
  {
    nom: "KO_FC-M07_siren-client.xml",
    xml: muter(BASE, '<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">987654324</ram:ID></ram:SpecifiedLegalOrganization>\n        ', ""),
    attendu: { ruleId: "MEN-002", specId: "FC-M07" },
  },
  {
    nom: "KO_FC-M04_siren-cle.xml",
    xml: muter(BASE, '<ram:ID schemeID="0002">123456782</ram:ID>', '<ram:ID schemeID="0002">123456780</ram:ID>'),
    attendu: { ruleId: "MEN-001", specId: "FC-M04" },
  },
  {
    nom: "KO_FC-C05_ttc.xml",
    xml: muter(BASE, "<ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>", "<ram:GrandTotalAmount>1300.00</ram:GrandTotalAmount>"),
    attendu: { ruleId: "MNT-001", specId: "FC-C05" },
  },
  {
    nom: "KO_FC-M02_date.xml",
    xml: muter(BASE, '<ram:IssueDateTime><udt:DateTimeString format="102">20260115</udt:DateTimeString></ram:IssueDateTime>\n    ', ""),
    attendu: { ruleId: "DAT-001", specId: "FC-M02" },
  },
  {
    nom: "KO_FC-M01_numero.xml",
    xml: muter(BASE, "<ram:ID>FA-2026-0001</ram:ID>", "<ram:ID></ram:ID>"),
    attendu: { ruleId: "NUM-001", specId: "FC-M01" },
  },
  {
    nom: "KO_FC-M14_paiement.xml",
    xml: muter(BASE, '<ram:SpecifiedTradePaymentTerms>\n        <ram:DueDateDateTime><udt:DateTimeString format="102">20260214</udt:DateTimeString></ram:DueDateDateTime>\n      </ram:SpecifiedTradePaymentTerms>\n      ', ""),
    attendu: { ruleId: "MEN-008", specId: "FC-M14" },
  },
  {
    nom: "KO_FC-S05_profil.xml",
    xml: muter(BASE, "<ram:ID>urn:cen.eu:en16931:2017</ram:ID>", "<ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>"),
    attendu: { ruleId: "FMT-003", specId: "FC-S05" },
  },
  {
    nom: "KO_FC-M13_ligne-incomplete.xml",
    xml: muter(BASE, "<ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>\n        </ram:ApplicableTradeTax>", "</ram:ApplicableTradeTax>"),
    attendu: { ruleId: "MEN-010", specId: "FC-M13" },
  },
  {
    nom: "KO_FC-C01_net-ligne.xml",
    xml: muter(BASE, "<ram:LineTotalAmount>1000.00</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>", "<ram:LineTotalAmount>900.00</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>"),
    attendu: { ruleId: "MNT-005", specId: "FC-C01" },
  },
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const manifest = [];
for (const c of CAS) {
  fs.writeFileSync(path.join(OUT, c.nom), c.xml, "utf8");
  manifest.push({ fichier: c.nom, ...c.attendu });
}
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Généré ${CAS.length} fichiers + manifest.json dans fixtures-corpus/`);
