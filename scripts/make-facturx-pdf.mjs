// Génère des fixtures Factur-X (PDF/A-3 avec XML CII embarqué) pour les tests.
//
// Le PDF produit est STRUCTURELLEMENT valide (en-tête, objets, table xref,
// trailer corrects — il s'ouvre dans un lecteur) et porte les marqueurs
// Factur-X que lit notre extracteur (src/lib/engine/formats/pdf.ts) :
//   - XMP avec pdfaid:part=3, pdfaid:conformance=B, fx:Version, fx:ConformanceLevel ;
//   - fichier embarqué déclaré via /F (…​.xml) + arbre /EmbeddedFiles ;
//   - le XML CII en clair dans un flux (sliceInvoiceXml le retrouve).
//
// IMPORTANT : ce n'est PAS une validation PDF/A-3 complète (profil ICC, output
// intent, polices incorporées… = veraPDF). C'est précisément la limite assumée
// FC-S02 (exhaustif:false → « Contrôle partiel »). Ces fixtures couvrent le
// CHEMIN D'EXTRACTION et les contrôles de conteneur, pas la conformité PDF/A.
//
// Usage : node scripts/make-facturx-pdf.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "fixtures-corpus-pdf");
fs.mkdirSync(OUT, { recursive: true });

// Source de vérité du XML : le CII conforme déjà versionné et testé.
const CII = fs.readFileSync(path.join(ROOT, "fixtures-corpus/OK_CII_conforme.xml"), "utf8").replace(/^﻿/, "");

// XMP conforme PDF/A-3 : identifiant pdfaid (prédéfini), propriétés Dublin Core /
// xmp / pdf (prédéfinies), bloc fx: (Factur-X) ET la déclaration d'EXTENSION SCHEMA
// qui décrit le namespace fx: — exigée par ISO 19005-3 §6.6.2.3.1/2 (sinon veraPDF
// échoue car les propriétés fx: ne sont pas dans un schéma connu).
function xmp(fileName, level) {
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
   <pdfaid:part>3</pdfaid:part>
   <pdfaid:conformance>B</pdfaid:conformance>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">Facture de démonstration FactuCheck</rdf:li></rdf:Alt></dc:title>
   <dc:creator><rdf:Seq><rdf:li>FactuCheck</rdf:li></rdf:Seq></dc:creator>
   <dc:description><rdf:Alt><rdf:li xml:lang="x-default">Fixture Factur-X de test</rdf:li></rdf:Alt></dc:description>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
   <xmp:CreatorTool>FactuCheck fixtures</xmp:CreatorTool>
   <xmp:CreateDate>2026-01-15T00:00:00Z</xmp:CreateDate>
   <xmp:ModifyDate>2026-01-15T00:00:00Z</xmp:ModifyDate>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
   <pdf:Producer>FactuCheck fixtures</pdf:Producer>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
   <fx:DocumentType>INVOICE</fx:DocumentType>
   <fx:DocumentFileName>${fileName}</fx:DocumentFileName>
   <fx:Version>1.0</fx:Version>
   <fx:ConformanceLevel>${level}</fx:ConformanceLevel>
  </rdf:Description>
  <rdf:Description rdf:about=""
    xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
    xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
    xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
   <pdfaExtension:schemas>
    <rdf:Bag>
     <rdf:li rdf:parseType="Resource">
      <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
      <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
      <pdfaSchema:prefix>fx</pdfaSchema:prefix>
      <pdfaSchema:property>
       <rdf:Seq>
        <rdf:li rdf:parseType="Resource">
         <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
         <pdfaProperty:valueType>Text</pdfaProperty:valueType>
         <pdfaProperty:category>external</pdfaProperty:category>
         <pdfaProperty:description>name of the embedded XML invoice file</pdfaProperty:description>
        </rdf:li>
        <rdf:li rdf:parseType="Resource">
         <pdfaProperty:name>DocumentType</pdfaProperty:name>
         <pdfaProperty:valueType>Text</pdfaProperty:valueType>
         <pdfaProperty:category>external</pdfaProperty:category>
         <pdfaProperty:description>INVOICE</pdfaProperty:description>
        </rdf:li>
        <rdf:li rdf:parseType="Resource">
         <pdfaProperty:name>Version</pdfaProperty:name>
         <pdfaProperty:valueType>Text</pdfaProperty:valueType>
         <pdfaProperty:category>external</pdfaProperty:category>
         <pdfaProperty:description>The actual version of the Factur-X XML schema</pdfaProperty:description>
        </rdf:li>
        <rdf:li rdf:parseType="Resource">
         <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
         <pdfaProperty:valueType>Text</pdfaProperty:valueType>
         <pdfaProperty:category>external</pdfaProperty:category>
         <pdfaProperty:description>The conformance level of the embedded Factur-X data</pdfaProperty:description>
        </rdf:li>
       </rdf:Seq>
      </pdfaSchema:property>
     </rdf:li>
    </rdf:Bag>
   </pdfaExtension:schemas>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

// Construit un PDF minimal mais valide (xref calculée) avec le XML embarqué.
function buildPdf({ embeddedName }) {
  const meta = xmp(embeddedName, "EN 16931");
  const enc = (s) => Buffer.from(s, "utf8");

  // Corps de chaque objet (sans l'en-tête "N 0 obj").
  const bodies = [
    // 1 Catalog
    `<< /Type /Catalog /Pages 2 0 R /Metadata 4 0 R /AF [6 0 R] /Names << /EmbeddedFiles << /Names [ (${embeddedName}) 6 0 R ] >> >> >>`,
    // 2 Pages
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    // 3 Page
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> >>`,
    // 4 Metadata (XMP)
    `<< /Type /Metadata /Subtype /XML /Length ${enc(meta).length} >>\nstream\n${meta}\nendstream`,
    // 5 Embedded file stream (le XML CII, en clair)
    `<< /Type /EmbeddedFile /Subtype /text#2Fxml /Length ${enc(CII).length} /Params << /Size ${enc(CII).length} >> >>\nstream\n${CII}\nendstream`,
    // 6 Filespec
    `<< /Type /Filespec /F (${embeddedName}) /UF (${embeddedName}) /AFRelationship /Data /EF << /F 5 0 R /UF 5 0 R >> >>`,
  ];

  const header = "%PDF-1.7\n%\xE2\xE3\xCF\xD3\n";
  let pdf = Buffer.from(header, "latin1");
  const offsets = [];
  bodies.forEach((body, i) => {
    offsets[i] = pdf.length;
    pdf = Buffer.concat([pdf, Buffer.from(`${i + 1} 0 obj\n`, "latin1"), enc(body), Buffer.from("\nendobj\n", "latin1")]);
  });

  const xrefStart = pdf.length;
  const n = bodies.length + 1;
  let xref = `xref\n0 ${n}\n0000000000 65535 f \n`;
  for (let i = 0; i < bodies.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  // ISO 19005-3 §6.1.3 : le trailer doit porter un /ID (deux chaînes d'identifiants).
  const fid = "46414354554348454b4649585455524531"; // "FACTUCHECKFIXTURE1" en hexa
  const trailer = `trailer\n<< /Size ${n} /Root 1 0 R /ID [<${fid}><${fid}>] >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  pdf = Buffer.concat([pdf, Buffer.from(xref + trailer, "latin1")]);
  return pdf;
}

const cas = [
  { fichier: "OK_FACTURX_conforme.pdf", embeddedName: "factur-x.xml" },
  { fichier: "KO_FACTURX_FC-S03_nom.pdf", embeddedName: "facture.xml" }, // nom non conforme → PDF-003
];

for (const c of cas) {
  const bytes = buildPdf(c);
  fs.writeFileSync(path.join(OUT, c.fichier), bytes);
  console.log(`• ${c.fichier} (${bytes.length} o, embarqué « ${c.embeddedName} »)`);
}

const manifest = [
  { fichier: "OK_FACTURX_conforme.pdf", format: "FACTURX_PDF", conforme: true },
  { fichier: "KO_FACTURX_FC-S03_nom.pdf", format: "FACTURX_PDF", ruleId: "PDF-003", specId: "FC-S03" },
];
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("• manifest.json écrit.");
