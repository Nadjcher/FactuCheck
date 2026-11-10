// Rend un schematron exécutable par node-schematron :
//  - retire les <xsl:function> (portées en JS, voir schematron-functions.ts) ;
//  - transforme les <let> en expressions `let ... return` XPath natives, car
//    node-schematron atomise les variables <let> qui tiennent des nœuds.
// Idempotent : un schematron sans <xsl:function> ni <let> (EN 16931 développé,
// schematrons maison) est renvoyé inchangé.

const LET = /<let\s+name="([^"]+)"\s+value="([^"]*)"\s*\/>/g;
const RULE = /<rule\b[\s\S]*?<\/rule>/g;

const substVars = (text: string, scope: Map<string, string>) =>
  text.replace(/\$([A-Za-z_][\w-]*)/g, (w, n) => (scope.has(n) ? `(${scope.get(n)})` : w));

function neededOrdered(expr: string, defs: Map<string, string>): string[] {
  const need = new Set<string>();
  const stack: string[] = [];
  for (const m of expr.matchAll(/\$([A-Za-z_][\w-]*)/g)) if (defs.has(m[1])) stack.push(m[1]);
  while (stack.length) {
    const n = stack.pop() as string;
    if (need.has(n)) continue;
    need.add(n);
    for (const m of (defs.get(n) as string).matchAll(/\$([A-Za-z_][\w-]*)/g))
      if (defs.has(m[1])) stack.push(m[1]);
  }
  return [...defs.keys()].filter((k) => need.has(k));
}

function wrap(expr: string, defs: Map<string, string>): string | null {
  const ord = neededOrdered(expr, defs);
  if (ord.length === 0) return null;
  const bindings = ord.map((n) => `$${n} := (${defs.get(n)})`).join(", ");
  return `let ${bindings} return (${expr})`;
}

export function transformerSchematron(input: string): string {
  // 1. Retire les définitions <xsl:function>.
  let text = input.replace(/<xsl:function[\s\S]*?<\/xsl:function>/g, "");

  // 2. Normalise select='...' -> select="..." (évite les conflits de quotes).
  text = text.replace(/select='([^']*)'/g, (m, x) => (x.includes('"') ? m : `select="${x}"`));

  // 3. Inline les <let> globaux (hors rules), ce sont des chemins absolus / count,
  //    donc sûrs à inliner, y compris dans les contextes de rule.
  const masked = text.replace(RULE, (s) => " ".repeat(s.length));
  const resolved = new Map<string, string>();
  let g: RegExpExecArray | null;
  LET.lastIndex = 0;
  while ((g = LET.exec(masked))) resolved.set(g[1], substVars(g[2], resolved));
  text = substVars(text, resolved);

  // 4. Lets de rule -> `let ... return` natif dans test=/select=.
  let out = text.replace(RULE, (rule) => {
    const defs = new Map<string, string>();
    let r: RegExpExecArray | null;
    LET.lastIndex = 0;
    while ((r = LET.exec(rule))) {
      defs.delete(r[1]);
      defs.set(r[1], r[2]);
    }
    let body = rule.replace(/<let\s+name="[^"]+"\s+value="[^"]*"\s*\/>\s*/g, "");
    if (defs.size === 0) return body;
    body = body.replace(/\btest="([^"]*)"/g, (m, t) => {
      const w = wrap(t, defs);
      return w ? `test="${w}"` : m;
    });
    body = body.replace(/\bselect="([^"]*)"/g, (m, x) => {
      const w = wrap(x, defs);
      return w ? `select="${w}"` : m;
    });
    return body;
  });

  // 5. Retire les <let> globaux restants.
  out = out.replace(/<let\s+name="[^"]+"\s+value="[^"]*"\s*\/>\s*/g, "");
  return out;
}
