// Robustesse : le moteur ne doit JAMAIS planter, boucler, lire un fichier local
// ni produire un rapport incohérent sur des entrées bizarres, malformées ou
// hostiles. Il renvoie toujours un Report structuré (erreurParsing le cas échéant).
import { describe, it, expect } from "vitest";
import { analyserFichier, analyserFichierComplet } from "./run";
import { toNumber, parseXml } from "./xml";
import { CII_EXEMPLE_CONFORME } from "./__fixtures__/invoices";

function analyse(contenu: string | Buffer, nom = "test.xml") {
  const bytes = Buffer.isBuffer(contenu) ? contenu : Buffer.from(contenu, "utf8");
  return analyserFichier({ nom, bytes });
}

/** Un rapport doit toujours avoir une forme valide, quoi qu'il arrive. */
function rapportValide(r: ReturnType<typeof analyse>) {
  expect(typeof r.report.conforme).toBe("boolean");
  expect(typeof r.report.exhaustif).toBe("boolean");
  expect(Array.isArray(r.report.findings)).toBe(true);
  expect(Number.isFinite(r.report.score)).toBe(true);
  expect(r.report.score).toBeGreaterThanOrEqual(0);
  expect(r.report.score).toBeLessThanOrEqual(100);
}

describe("entrées malformées / illisibles", () => {
  const cas: Array<[string, string | Buffer]> = [
    ["vide", ""],
    ["espaces", "   \n\t  "],
    ["texte brut", "ceci n'est pas une facture"],
    ["XML tronqué", "<rsm:CrossIndustryInvoice>"],
    ["balises non fermées", "<a><b></a>"],
    ["racine inconnue", "<html><body>facture</body></html>"],
    ["JSON", '{"facture":true}'],
    ["octets binaires", Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0x42, 0x00])],
    ["PDF factice sans XML", "%PDF-1.4\n%garbage\nendobj\n%%EOF"],
    ["BOM + texte", "﻿pas du xml"],
    ["seulement un chevron", "<"],
    ["déclaration XML seule", '<?xml version="1.0"?>'],
  ];
  for (const [nom, contenu] of cas) {
    it(`ne plante pas : ${nom}`, () => {
      let r!: ReturnType<typeof analyse>;
      expect(() => (r = analyse(contenu))).not.toThrow();
      rapportValide(r);
      // rien d'illisible ne doit être déclaré conforme
      expect(r.report.conforme).toBe(false);
    });
  }
});

describe("attaques XML (ni plantage, ni blocage, ni lecture de fichier)", () => {
  it("bombe d'entités (milliards de rires) : pas d'expansion incontrôlée", () => {
    const bomb = `<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
  <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
  <!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">
  <!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">
  <!ENTITY lol7 "&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;">
  <!ENTITY lol8 "&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;">
  <!ENTITY lol9 "&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;">
]>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"><ram:X>&lol9;</ram:X></rsm:CrossIndustryInvoice>`;
    const t0 = Date.now();
    let r!: ReturnType<typeof analyse>;
    expect(() => (r = analyse(bomb))).not.toThrow();
    expect(Date.now() - t0).toBeLessThan(2000); // pas de blocage
    rapportValide(r);
  });

  it("XXE : une entité externe SYSTEM ne lit pas le fichier local", () => {
    const xxe = `<?xml version="1.0"?>
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">
  <rsm:ExchangedDocument><ram:ID xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100">&xxe;</ram:ID></rsm:ExchangedDocument>
</rsm:CrossIndustryInvoice>`;
    let r!: ReturnType<typeof analyse>;
    expect(() => (r = analyse(xxe))).not.toThrow();
    const brut = JSON.stringify(r.parsed);
    expect(brut).not.toMatch(/root:.*:0:0:/); // aucun contenu de /etc/passwd
    rapportValide(r);
  });

  it("DOCTYPE avec DTD externe : pas de récupération réseau/fichier", () => {
    const ext = `<?xml version="1.0"?>
<!DOCTYPE rsm:CrossIndustryInvoice SYSTEM "http://example.invalid/evil.dtd">
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"/>`;
    expect(() => analyse(ext)).not.toThrow();
  });
});

describe("valeurs / unicode hostiles dans les champs", () => {
  const injections = [
    "<script>alert(1)</script>",
    "\u0000\u0001\u0002",
    "‮moc.elpmaxe", // RTL override
    "😀".repeat(500),
    "A".repeat(100000),
    "'; DROP TABLE factures;--",
  ];
  for (const val of injections) {
    it(`champ hostile toléré : ${val.slice(0, 16)}…`, () => {
      const xml = `<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"><rsm:ExchangedDocument><ram:ID>${val.replace(/[<&]/g, "")}</ram:ID></rsm:ExchangedDocument></rsm:CrossIndustryInvoice>`;
      let r!: ReturnType<typeof analyse>;
      expect(() => (r = analyse(xml))).not.toThrow();
      rapportValide(r);
    });
  }
});

describe("montants exotiques (toNumber)", () => {
  const cas: Array<[string, number | null]> = [
    ["1000.00", 1000],
    ["1000,00", 1000],
    ["1 000,00", 1000],
    ["-5", -5],
    ["", null],
    ["   ", null],
    ["abc", null],
    ["1,2,3", null],
    ["1.2.3", null],
    ["Infinity", null],
    ["NaN", null],
    ["0x10", null], // hexadécimal : refusé
    ["1e3", null], // notation scientifique : refusée (XSD decimal ne l'autorise pas)
    ["0b10", null],
    ["  +42 ", 42],
    ["１２３", null], // chiffres pleine largeur : refusés
  ];
  for (const [entree, attendu] of cas) {
    it(`"${entree}" → ${attendu}`, () => {
      expect(toNumber(entree)).toBe(attendu);
    });
  }
});

describe("structures tordues (doublons, tableaux, imbrication)", () => {
  it("deux SellerTradeParty (tableau là où un scalaire est attendu)", () => {
    const xml = `<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100">
      <rsm:SupplyChainTradeTransaction><ram:ApplicableHeaderTradeAgreement>
        <ram:SellerTradeParty><ram:Name>A</ram:Name></ram:SellerTradeParty>
        <ram:SellerTradeParty><ram:Name>B</ram:Name></ram:SellerTradeParty>
      </ram:ApplicableHeaderTradeAgreement></rsm:SupplyChainTradeTransaction></rsm:CrossIndustryInvoice>`;
    let r!: ReturnType<typeof analyse>;
    expect(() => (r = analyse(xml))).not.toThrow();
    rapportValide(r);
  });

  it("imbrication profonde bornée", () => {
    const prof = 400;
    const xml =
      `<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">` +
      "<x>".repeat(prof) +
      "v" +
      "</x>".repeat(prof) +
      `</rsm:CrossIndustryInvoice>`;
    expect(() => analyse(xml)).not.toThrow();
  });

  it("SIREN et dates aberrants ne font pas planter", () => {
    const xml = `<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
      <rsm:ExchangedDocument><ram:ID>N</ram:ID><ram:IssueDateTime><udt:DateTimeString format="102">20260230</udt:DateTimeString></ram:IssueDateTime></rsm:ExchangedDocument>
      <rsm:SupplyChainTradeTransaction><ram:ApplicableHeaderTradeAgreement>
        <ram:SellerTradeParty><ram:SpecifiedLegalOrganization><ram:ID>12345678A</ram:ID></ram:SpecifiedLegalOrganization></ram:SellerTradeParty>
      </ram:ApplicableHeaderTradeAgreement></rsm:SupplyChainTradeTransaction></rsm:CrossIndustryInvoice>`;
    let r!: ReturnType<typeof analyse>;
    expect(() => (r = analyse(xml))).not.toThrow();
    // date Feb 30 invalide → DAT-002 ne doit pas la déclarer valide
    const dat = r.report.findings.find((f) => f.ruleId === "DAT-002");
    expect(dat?.statut === "avertissement" || dat?.statut === "non_applicable").toBe(true);
    rapportValide(r);
  });
});

describe("robustesse du parseur direct", () => {
  it("parseXml ne jette pas sur du non-XML (ou jette proprement, jamais de boucle)", () => {
    // parseXml peut jeter ; le pipeline l'enveloppe. On vérifie juste l'absence de boucle.
    for (const s of ["", "<", "<a>", "}{", "\u0000"]) {
      try {
        parseXml(s);
      } catch {
        /* toléré */
      }
    }
    expect(true).toBe(true);
  });

  it("la facture d'exemple conforme reste conforme (non-régression)", () => {
    const r = analyse(CII_EXEMPLE_CONFORME);
    expect(r.report.counts.bloquant).toBe(0);
  });
});

describe("pipeline complet (schematron + services) sur entrées hostiles", () => {
  const cas: Array<[string, string | Buffer]> = [
    ["racine CII mais vide", '<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"/>'],
    ["CII malformée", "<rsm:CrossIndustryInvoice xmlns:rsm=\"urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100\"><ram:X>&amp;&amp;</ram:X>"],
    ["octets binaires", Buffer.from([0x00, 0xff, 0x10, 0x3c, 0x3e])],
    ["texte brut", "bonjour"],
  ];
  for (const [nom, contenu] of cas) {
    it(`ne plante pas : ${nom}`, async () => {
      const bytes = Buffer.isBuffer(contenu) ? contenu : Buffer.from(contenu, "utf8");
      let out!: Awaited<ReturnType<typeof analyserFichierComplet>>;
      await expect(
        (async () => {
          out = await analyserFichierComplet({ nom: "h.xml", bytes });
        })(),
      ).resolves.toBeUndefined();
      expect(typeof out.report.conforme).toBe("boolean");
      expect(out.report.conforme).toBe(false);
    });
  }
});
