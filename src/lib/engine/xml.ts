// Helpers de navigation dans un objet XML parsé (fast-xml-parser, removeNSPrefix).
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false, // on garde les valeurs en string pour les parser nous-mêmes
});

export function parseXml(xml: string): Record<string, unknown> {
  return parser.parse(xml) as Record<string, unknown>;
}

/** Accès tolérant par chemin pointé ; renvoie le premier élément si tableau. */
export function get(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of path.split(".")) {
    if (cur == null) return undefined;
    if (Array.isArray(cur)) cur = cur[0];
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  if (Array.isArray(cur)) return cur[0];
  return cur;
}

/** Valeur texte d'un nœud, qu'il soit scalaire ou objet avec texte + attributs. */
export function text(node: unknown): string | null {
  if (node == null) return null;
  if (typeof node === "string") return node.trim() || null;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return text(node[0]);
  if (typeof node === "object") {
    const t = (node as Record<string, unknown>)["#text"];
    if (t != null) return String(t).trim() || null;
  }
  return null;
}

export function textAt(obj: unknown, path: string): string | null {
  return text(get(obj, path));
}

/** Parse un montant en acceptant la virgule ou le point décimal. */
export function toNumber(v: string | null): number | null {
  if (v == null) return null;
  const cleaned = v.replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Renvoie le premier chemin non vide. */
export function firstTextAt(obj: unknown, paths: string[]): string | null {
  for (const p of paths) {
    const v = textAt(obj, p);
    if (v) return v;
  }
  return null;
}
