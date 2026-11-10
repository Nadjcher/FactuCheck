<?xml version="1.0" encoding="UTF-8"?>
<!--
  Schematron FactuCheck pour CII / Factur-X.
  Règles maison, SOURCÉES mais « À VÉRIFIER » : à remplacer/compléter par les
  schematrons officiels (EN 16931 CII, FNFE-MPE) déposés dans schematron/official/.
  Démontre notamment les contrôles de calcul AU NIVEAU LIGNE (BR-CO-10/13)
  que le moteur « métier » ne faisait pas.
  flag="fatal" => bloquant, flag="warning" => avertissement.
-->
<schema xmlns="http://purl.oclc.org/dsdl/schematron" queryBinding="xslt2">
  <title>FactuCheck CII (EN 16931 — sous-ensemble à vérifier)</title>
  <ns prefix="rsm" uri="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"/>
  <ns prefix="ram" uri="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"/>
  <ns prefix="udt" uri="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"/>

  <pattern id="montants">
    <rule context="ram:SpecifiedTradeSettlementHeaderMonetarySummation">
      <assert id="BR-CO-15" flag="fatal"
        test="not(ram:GrandTotalAmount and ram:TaxBasisTotalAmount and ram:TaxTotalAmount) or abs(number(ram:GrandTotalAmount) - (number(ram:TaxBasisTotalAmount) + number(ram:TaxTotalAmount))) &lt;= 0.01">[BR-CO-15] Le montant TTC (GrandTotalAmount) doit être égal au total HT (TaxBasisTotalAmount) augmenté de la TVA (TaxTotalAmount).</assert>

      <assert id="BR-CO-13" flag="fatal"
        test="not(ram:TaxBasisTotalAmount and ram:LineTotalAmount) or abs(number(ram:TaxBasisTotalAmount) - (number(ram:LineTotalAmount) - (if (ram:AllowanceTotalAmount) then number(ram:AllowanceTotalAmount) else 0) + (if (ram:ChargeTotalAmount) then number(ram:ChargeTotalAmount) else 0))) &lt;= 0.01">[BR-CO-13] Le total HT doit être égal au total des lignes diminué des remises et augmenté des frais.</assert>

      <assert id="BR-CO-10" flag="fatal"
        test="not(ram:LineTotalAmount) or count(/rsm:CrossIndustryInvoice/rsm:SupplyChainTradeTransaction/ram:IncludedSupplyChainTradeLineItem) = 0 or abs(number(ram:LineTotalAmount) - sum(/rsm:CrossIndustryInvoice/rsm:SupplyChainTradeTransaction/ram:IncludedSupplyChainTradeLineItem/ram:SpecifiedLineTradeSettlement/ram:SpecifiedTradeSettlementLineMonetarySummation/ram:LineTotalAmount)) &lt;= 0.01">[BR-CO-10] Le total des lignes doit être égal à la somme des montants nets de chaque ligne.</assert>
    </rule>
  </pattern>

  <pattern id="mentions">
    <rule context="/rsm:CrossIndustryInvoice/rsm:SupplyChainTradeTransaction/ram:ApplicableHeaderTradeAgreement">
      <assert id="BR-FR-CTC-01" flag="fatal"
        test="ram:BuyerTradeParty/ram:SpecifiedLegalOrganization/ram:ID">[BR-FR-CTC-01] Le SIREN de l'acheteur (BuyerTradeParty/SpecifiedLegalOrganization/ID) est obligatoire.</assert>
    </rule>
  </pattern>
</schema>
