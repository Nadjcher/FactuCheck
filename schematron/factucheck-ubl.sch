<?xml version="1.0" encoding="UTF-8"?>
<!--
  Schematron FactuCheck pour UBL (Invoice-2).
  Règles maison, SOURCÉES mais « À VÉRIFIER » : à remplacer/compléter par le
  schematron officiel EN 16931 UBL déposé dans schematron/official/.
  flag="fatal" => bloquant, flag="warning" => avertissement.
-->
<schema xmlns="http://purl.oclc.org/dsdl/schematron" queryBinding="xslt2">
  <title>FactuCheck UBL (EN 16931 — sous-ensemble à vérifier)</title>
  <ns prefix="ubl" uri="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"/>
  <ns prefix="cac" uri="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"/>
  <ns prefix="cbc" uri="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"/>

  <pattern id="montants">
    <rule context="cac:LegalMonetaryTotal">
      <assert id="BR-CO-15" flag="fatal"
        test="not(cbc:TaxInclusiveAmount and cbc:TaxExclusiveAmount and ../cac:TaxTotal) or abs(number(cbc:TaxInclusiveAmount) - (number(cbc:TaxExclusiveAmount) + number((../cac:TaxTotal/cbc:TaxAmount)[1]))) &lt;= 0.01">[BR-CO-15] Le montant TTC (TaxInclusiveAmount) doit être égal au total HT (TaxExclusiveAmount) augmenté de la TVA (TaxTotal/TaxAmount).</assert>

      <assert id="BR-CO-10" flag="fatal"
        test="not(cbc:LineExtensionAmount) or count(/ubl:Invoice/cac:InvoiceLine) = 0 or abs(number(cbc:LineExtensionAmount) - sum(/ubl:Invoice/cac:InvoiceLine/cbc:LineExtensionAmount)) &lt;= 0.01">[BR-CO-10] Le total des lignes doit être égal à la somme des montants nets de chaque ligne.</assert>
    </rule>
  </pattern>

  <pattern id="mentions">
    <rule context="/ubl:Invoice/cac:AccountingCustomerParty/cac:Party">
      <assert id="BR-FR-CTC-01" flag="fatal"
        test="cac:PartyLegalEntity/cbc:CompanyID">[BR-FR-CTC-01] Le SIREN du client (PartyLegalEntity/CompanyID) est obligatoire.</assert>
    </rule>
  </pattern>

  <!-- TVA par taux (répartition BG-23 : cac:TaxTotal/cac:TaxSubtotal). -->
  <pattern id="tva">
    <rule context="/ubl:Invoice/cac:TaxTotal/cac:TaxSubtotal">
      <assert id="BR-CO-17" flag="fatal"
        test="not(cbc:TaxableAmount and cac:TaxCategory/cbc:Percent and cbc:TaxAmount) or abs(number(cbc:TaxAmount) - (round(number(cbc:TaxableAmount) * number(cac:TaxCategory/cbc:Percent) div 100 * 100) div 100)) &lt;= 0.01">[BR-CO-17] Le montant de TVA d'une catégorie doit être égal à la base (BT-116) multipliée par le taux (BT-119), arrondi à 2 décimales.</assert>
    </rule>
  </pattern>
</schema>
