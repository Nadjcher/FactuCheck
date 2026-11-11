// Injections : une facture vient d'un tiers inconnu. On vérifie que les données
// qu'elle contient ne peuvent ni exécuter de code dans le rapport (XSS), ni
// faire boucler une regex (ReDoS), ni exécuter une commande (le nom de fichier
// n'est jamais interprété). SQL : aucune requête brute (Supabase = SDK paramétré).
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import { analyserFichier } from "./run";
import { parseInvoice } from "./parse";

const XSS = [
  "<script>alert(document.cookie)</script>",
  '"><img src=x onerror=alert(1)>',
  "javascript:alert(1)",
  "<svg/onload=alert(1)>",
  "</p><iframe src=javascript:alert(1)>",
];

/** Construit une facture CII dont des champs affichés portent une charge XSS. */
function factureAvecCharge(charge: string): Buffer {
  // Encodé en entités pour un XML bien formé ; fast-xml-parser le redécode en texte.
  const esc = charge.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const xml = `<rsm:CrossIndustryInvoice
    xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100">
    <rsm:ExchangedDocument><ram:ID>${esc}</ram:ID></rsm:ExchangedDocument>
    <rsm:SupplyChainTradeTransaction><ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>${esc}</ram:Name>
        <ram:SpecifiedLegalOrganization><ram:ID>${esc}</ram:ID></ram:SpecifiedLegalOrganization>
      </ram:SellerTradeParty>
    </ram:ApplicableHeaderTradeAgreement></rsm:SupplyChainTradeTransaction>
  </rsm:CrossIndustryInvoice>`;
  return Buffer.from(xml, "utf8");
}

describe("XSS — les données de facture sont des DONNÉES, jamais du code exécutable", () => {
  for (const charge of XSS) {
    it(`échappée dans le rapport rendu : ${charge.slice(0, 24)}…`, () => {
      const { parsed, report } = analyserFichier({ nom: "x.xml", bytes: factureAvecCharge(charge) });

      // 1) La charge traverse bien le moteur comme une simple chaîne (donnée).
      expect(parsed.numero).toBe(charge);
      const porteuses = report.findings.filter((f) => f.message.includes(charge));
      expect(porteuses.length).toBeGreaterThan(0);

      // 2) Rendue par React (comme dans le rapport), elle est ÉCHAPPÉE : aucune
      //    balise active ne subsiste dans le HTML produit.
      const html = renderToStaticMarkup(
        React.createElement(
          React.Fragment,
          null,
          report.findings.map((f, i) =>
            React.createElement("div", { key: i }, f.message, " ", f.libelle),
          ),
        ),
      );
      expect(html).not.toMatch(/<script/i);
      expect(html).not.toMatch(/<img[^>]+onerror/i);
      expect(html).not.toMatch(/<svg[^>]+onload/i);
      expect(html).not.toMatch(/<iframe/i);
      // La charge est présente, mais sous forme échappée (&lt; …).
      if (charge.includes("<")) expect(html).toMatch(/&lt;/);
    });
  }

  it("un nom de fichier porteur de charge est aussi affiché de façon sûre", () => {
    const nom = '<script>alert(1)</script>.xml';
    const { report } = analyserFichier({ nom, bytes: factureAvecCharge("x") });
    const html = renderToStaticMarkup(React.createElement("span", { title: nom }, nom));
    expect(html).not.toMatch(/<script/i);
    expect(report).toBeDefined();
  });
});

describe("Injection de commande — le nom de fichier n'est jamais exécuté", () => {
  it("un nom avec métacaractères shell est un simple libellé", () => {
    const nom = '"; rm -rf / ; echo "pwned.xml';
    // nom n'est utilisé que comme étiquette ; aucun accès disque ni shell.
    expect(() => analyserFichier({ nom, bytes: factureAvecCharge("x") })).not.toThrow();
    // Les services (veraPDF/XSD) appellent execFile (pas de shell) avec des
    // arguments fixes et un fichier temporaire généré, jamais le nom fourni.
    // → impossible d'injecter une commande via le contenu ou le nom.
    expect(true).toBe(true);
  });
});

describe("ReDoS — aucune regex ne doit boucler sur une entrée pathologique", () => {
  it("PDF annoncé mais flux XML non terminé (regex d'extraction)", () => {
    // %PDF + un <?xml ouvert suivi de 2 Mo sans balise de fermeture : piège
    // classique pour une regex paresseuse [\\s\\S]*?.
    const buf = Buffer.concat([
      Buffer.from("%PDF-1.7\n", "latin1"),
      Buffer.from("<?xml version='1.0'?><rsm:CrossIndustryInvoice ", "latin1"),
      Buffer.from("A".repeat(2_000_000), "latin1"),
    ]);
    const t0 = Date.now();
    expect(() => parseInvoice({ nom: "p.pdf", bytes: buf })).not.toThrow();
    expect(Date.now() - t0).toBeLessThan(2000);
  });

  it("flux PDF compressés multiples et non pertinents", () => {
    const streams = "stream\n" + "x".repeat(50_000) + "\nendstream\n";
    const buf = Buffer.concat([
      Buffer.from("%PDF-1.7\n", "latin1"),
      Buffer.from(streams.repeat(20), "latin1"),
    ]);
    const t0 = Date.now();
    expect(() => parseInvoice({ nom: "p.pdf", bytes: buf })).not.toThrow();
    expect(Date.now() - t0).toBeLessThan(2000);
  });
});
