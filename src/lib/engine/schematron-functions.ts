// Portage JS des fonctions XSLT personnalisées (custom:*) des schematrons
// FNFE-MPE (BR-FR-Flux2), que fontoxpath n'exécute pas depuis <xsl:function>.
// Les versions sont UNIFIÉES pour accepter les deux syntaxes (CII et UBL),
// l'enregistrement fontoxpath étant global.
//
// Source des fonctions : fnfempe/France_RFE (EUPL 1.2).

const S = (v: unknown): string => (v == null ? "" : String(v));

const DOC_TYPE = new Set(
  "380 389 393 501 386 500 384 471 472 473 261 262 381 396 502 503".split(/\s+/),
);
const BILLING = new Set(
  "B1 S1 M1 B2 S2 M2 S3 B4 S4 M4 S5 S6 B7 S7 B8 S8 M8 B9 S9 M9".split(/\s+/),
);
const EAS = new Set(
  ("AN AQ AS AU EM 0002 0007 0009 0037 0060 0088 0096 0097 0106 0130 0135 0142 0147 0151 0154 0158 0170 0177 0183 0184 0188 0190 0191 0192 0193 0194 0195 0196 0198 0199 0200 0201 0202 0203 0204 0205 0208 0209 0210 0211 0212 0213 0215 0216 0217 0218 0221 0225 0230 0235 0240 9910 9913 9914 9915 9918 9919 9920 9922 9923 9924 9925 9926 9927 9928 9929 9930 9931 9932 9933 9934 9935 9936 9937 9938 9939 9940 9941 9942 9943 9944 9945 9946 9947 9948 9949 9950 9951 9952 9953 9957 9959").split(
    /\s+/,
  ),
);
const VAT_CAT = new Set(["S", "E", "AE", "K", "G", "O", "Z"]);
const VAT_RATE = new Set(
  "0 0.0 0.00 10 10.0 10.00 13 13.0 13.00 20 20.0 20.00 8.5 8.50 19.6 19.60 2.1 2.10 5.5 5.50 7 7.0 7.00 20.6 20.60 1.05 0.9 0.90 1.75 9.2 9.20 9.6 9.60".split(/\s+/),
);
const ATTACH = new Set([
  "RIB", "LISIBLE", "FEUILLE_DE_STYLE", "PJA", "BORDEREAU_SUIVI", "DOCUMENT_ANNEXE",
  "BON_LIVRAISON", "BON_COMMANDE", "BORDEREAU_SUIVI_VALIDATION", "ETAT_ACOMPTE",
  "FACTURE_PAIEMENT_DIRECT", "RECAPITULATIF_COTRAITANCE",
]);
const BAR = new Set(["B2B", "B2BINT", "B2C", "B2CINT", "OUTOFSCOPE", "ARCHIVEONLY"]);

function dayOk(y: number, m: number, day: number): boolean {
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const max = [1, 3, 5, 7, 8, 10, 12].includes(m)
    ? 31
    : [4, 6, 9, 11].includes(m)
      ? 30
      : m === 2
        ? leap
          ? 29
          : 28
        : 0;
  return day >= 1 && day <= max;
}

const decN = (re: RegExp, max: number) => (v: unknown) => {
  const s = S(v);
  return re.test(s) && s.replace(/\./g, "").length <= max;
};
const inList = (set: Set<string>) => (c: unknown) => set.has(S(c));

/** Implémentations pures (testables sans node-schematron). */
export const fonctions = {
  isValidIdFormat: (id: unknown) => {
    const s = S(id);
    const n = s.replace(/\s+/g, " ").trim();
    return /^[A-Za-z0-9+\-_/]+$/.test(n) && !/ /.test(s) && !s.startsWith(" ") && !s.endsWith(" ");
  },
  isValidSchemeIdFormat: (v: unknown) => /^[A-Za-z0-9+\-_.]+$/.test(S(v)),
  // Accepte AAAAMMJJ (CII/Factur-X) ou AAAA-MM-JJ (UBL).
  isValidDateFormat: (d: unknown) => {
    const s = S(d);
    const c = s.slice(0, 8);
    if (/^20\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/.test(c) && dayOk(+c.slice(0, 4), +c.slice(4, 6), +c.slice(6, 8))) return true;
    if (/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s) && dayOk(+s.slice(0, 4), +s.slice(5, 7), +s.slice(8, 10))) return true;
    return false;
  },
  isValidDocumentTypeCode: inList(DOC_TYPE),
  isValidBillingMode: inList(BILLING),
  isValidEasCode: inList(EAS),
  isValidVatCategoryCode: inList(VAT_CAT),
  isValidVatRate: inList(VAT_RATE),
  isValidAttachmentCode: inList(ATTACH),
  isValidBarTreatment: inList(BAR),
  isValidDecimal192: decN(/^-?\d{1,19}(\.\d{1,2})?$/, 19),
  isValidDecimal194: decN(/^-?\d{1,19}(\.\d{1,4})?$/, 19),
  isValidDecimal196Positive: decN(/^\d{1,19}(\.\d{1,6})?$/, 19),
  isValidDecimal196: decN(/^-?\d{1,19}(\.\d{1,6})?$/, 19),
  isValidPercent42Positive: decN(/^\d{1,4}(\.\d{1,2})?$/, 4),
  checkSiretSirenCoherence: (siret: unknown, siren: unknown) =>
    /^\d{14}$/.test(S(siret)) && S(siret).slice(0, 9) === S(siren),
};

// Namespaces pour la détection de « contrat spécial » (CII et UBL).
const RAM = "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100";
const CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";

type ElementLike = {
  textContent: string | null;
  getElementsByTagNameNS: (ns: string, name: string) => Iterable<ElementLike>;
};

function contextIds(node: ElementLike | null): string[] {
  const out: string[] = [];
  if (!node) return out;
  for (const p of node.getElementsByTagNameNS(RAM, "BusinessProcessSpecifiedDocumentContextParameter"))
    for (const id of p.getElementsByTagNameNS(RAM, "ID")) out.push((id.textContent || "").trim());
  for (const pid of node.getElementsByTagNameNS(CBC, "ProfileID")) out.push((pid.textContent || "").trim());
  return out;
}
const inAny = (n: ElementLike | null, set: Set<string>) => contextIds(n).some((v) => set.has(v));

const CUSTOM_NS = "http://www.example.org/custom";

type RegisterFn = (
  name: { namespaceURI: string; localName: string },
  argTypes: string[],
  returnType: string,
  impl: (...args: unknown[]) => unknown,
) => void;

let dejaEnregistre = false;

/** Enregistre toutes les fonctions custom:* dans fontoxpath (idempotent). */
export function registerFnfeFunctions(register: RegisterFn): void {
  if (dejaEnregistre) return;
  const b = (local: string, args: string[], impl: (...a: unknown[]) => unknown) => {
    try {
      register({ namespaceURI: CUSTOM_NS, localName: local }, args, "xs:boolean", (_ctx: unknown, ...a: unknown[]) => impl(...a));
    } catch {
      /* déjà enregistrée (rechargement) : on ignore */
    }
  };
  const str = ["xs:string?"];
  b("is-valid-id-format", str, fonctions.isValidIdFormat);
  b("is-valid-schemeid-format", str, fonctions.isValidSchemeIdFormat);
  b("is-valid-date-format", str, fonctions.isValidDateFormat);
  b("is-valid-document-type-code", str, fonctions.isValidDocumentTypeCode);
  b("is-valid-billing-mode", str, fonctions.isValidBillingMode);
  b("is-valid-eas-code", str, fonctions.isValidEasCode);
  b("is-valid-vat-category-code", str, fonctions.isValidVatCategoryCode);
  b("is-valid-vat-rate", str, fonctions.isValidVatRate);
  b("is-valid-attachment-code", str, fonctions.isValidAttachmentCode);
  b("is-valid-bar-treatment", str, fonctions.isValidBarTreatment);
  b("is-valid-decimal-19-2", str, fonctions.isValidDecimal192);
  b("is-valid-decimal-19-4", str, fonctions.isValidDecimal194);
  b("is-valid-decimal-19-6-positive", str, fonctions.isValidDecimal196Positive);
  b("is-valid-decimal-19-6", str, fonctions.isValidDecimal196);
  b("is-valid-percent-4-2-positive", str, fonctions.isValidPercent42Positive);
  b("check-siret-siren-coherence", ["xs:string?", "xs:string?"], fonctions.checkSiretSirenCoherence);
  b("isSpecialContract", ["node()?"], (n: unknown) => inAny(n as ElementLike, new Set(["S8", "B8", "M8"])));
  b("isSpecialContractMV", ["node()?"], (n: unknown) => inAny(n as ElementLike, new Set(["S8", "B8", "M8"])));
  b("isSpecialContractBD", ["node()?"], (n: unknown) => inAny(n as ElementLike, new Set(["S9", "B9", "M9"])));
  dejaEnregistre = true;
}
