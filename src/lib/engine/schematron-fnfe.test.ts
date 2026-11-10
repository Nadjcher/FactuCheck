import { describe, it, expect } from "vitest";
import { fonctions } from "./schematron-functions";
import { transformerSchematron } from "./schematron-transform";

describe("fonctions custom FNFE (portage JS)", () => {
  it("valide les dates CII (AAAAMMJJ) et UBL (AAAA-MM-JJ)", () => {
    expect(fonctions.isValidDateFormat("20260115")).toBe(true); // CII
    expect(fonctions.isValidDateFormat("2026-01-15")).toBe(true); // UBL
    expect(fonctions.isValidDateFormat("20260230")).toBe(false); // 30 février
    expect(fonctions.isValidDateFormat("2026-13-01")).toBe(false); // mois 13
    expect(fonctions.isValidDateFormat("20250229")).toBe(false); // 2025 non bissextile
    expect(fonctions.isValidDateFormat("20240229")).toBe(true); // 2024 bissextile
  });

  it("vérifie la cohérence SIRET/SIREN", () => {
    expect(fonctions.checkSiretSirenCoherence("12345678200012", "123456782")).toBe(true);
    expect(fonctions.checkSiretSirenCoherence("12345678200012", "999999999")).toBe(false);
    expect(fonctions.checkSiretSirenCoherence("1234", "123456782")).toBe(false);
  });

  it("valide les identifiants (pas d'espaces, caractères autorisés)", () => {
    expect(fonctions.isValidIdFormat("FA-2026-0001")).toBe(true);
    expect(fonctions.isValidIdFormat("FA 2026 0001")).toBe(false);
  });

  it("contrôle les listes de codes (TVA, mode de facturation)", () => {
    expect(fonctions.isValidVatRate("20.00")).toBe(true);
    expect(fonctions.isValidVatRate("17")).toBe(false);
    expect(fonctions.isValidVatCategoryCode("S")).toBe(true);
    expect(fonctions.isValidVatCategoryCode("X")).toBe(false);
    expect(fonctions.isValidBillingMode("B8")).toBe(true);
    expect(fonctions.isValidBillingMode("ZZ")).toBe(false);
  });

  it("valide les décimaux (19,2) et pourcentages (4,2)", () => {
    expect(fonctions.isValidDecimal192("1000.00")).toBe(true);
    expect(fonctions.isValidDecimal192("1000.000")).toBe(false); // 3 décimales
    expect(fonctions.isValidPercent42Positive("20.00")).toBe(true);
    expect(fonctions.isValidPercent42Positive("-5.00")).toBe(false); // positif requis
  });
});

describe("transformerSchematron", () => {
  it("retire les <xsl:function> et convertit les <let> en `let ... return`", () => {
    const sch = `<schema xmlns="http://purl.oclc.org/dsdl/schematron">
      <xsl:function xmlns:xsl="http://www.w3.org/1999/XSL/Transform" name="custom:f"><xsl:param name="x"/></xsl:function>
      <pattern><rule context="/a">
        <let name="notes" value="b/c"/>
        <assert test="exists($notes[d = 'X'])" id="T1">msg</assert>
      </rule></pattern>
    </schema>`;
    const out = transformerSchematron(sch);
    expect(out).not.toContain("<xsl:function");
    expect(out).not.toContain("<let ");
    expect(out).toContain("let $notes := (b/c) return");
  });

  it("laisse inchangé un schematron sans <let> ni <xsl:function>", () => {
    const sch = `<schema><pattern><rule context="/a"><assert test="b" id="T">m</assert></rule></pattern></schema>`;
    expect(transformerSchematron(sch)).toBe(sch);
  });
});
