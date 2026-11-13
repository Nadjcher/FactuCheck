import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, Mail, KeyRound, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "API & intégrations",
  description: "Validez vos factures électroniques par API ou par email. Documentation développeurs FactuCheck.",
};

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-[13px] leading-relaxed">
      <code className="font-mono text-foreground/90">{children}</code>
    </pre>
  );
}

function Section({ id, icon: Icon, titre, children }: { id: string; icon: React.ElementType; titre: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-10">
      <h2 className="flex items-center gap-2.5 text-2xl md:text-3xl">
        <Icon className="h-6 w-6 text-[hsl(var(--seal))]" aria-hidden="true" />
        {titre}
      </h2>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

const CHAMPS: [string, string][] = [
  ["verdict", "« conforme », « partiel » (structure/contenu OK mais conteneur PDF/A-3 non vérifié) ou « non_conforme »."],
  ["conforme", "booléen — aucun contrôle bloquant en échec."],
  ["exhaustif", "booléen — contrôle complet (false = « contrôle partiel »)."],
  ["score", "entier 0–100."],
  ["format", "« CII », « UBL », « FACTURX_PDF » ou « INCONNU »."],
  ["profil", "profil Factur-X (ex. « EN 16931 ») ou null."],
  ["resume", "{ reussis, avertissements, bloquants }."],
  ["aCorriger", "liste de { code, regle, probleme, corriger, severite, source }."],
  ["erreur", "message si le fichier est illisible, sinon null."],
];

export default function DeveloppeursPage() {
  return (
    <div className="container max-w-3xl py-14 md:py-20">
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">
          FactuCheck
          <span className="mx-1.5 text-[hsl(var(--ledger))]">·</span>
          <span className="font-medium text-foreground">API &amp; intégrations</span>
        </p>
        <h1 className="display-xl text-4xl md:text-5xl">Validez vos factures par programme.</h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Une seule requête HTTP pour contrôler une facture Factur-X, UBL ou CII contre les
          règles officielles EN 16931 et FNFE-MPE. Intégrable dans votre logiciel, votre boîte
          mail ou vos automatisations.
        </p>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2 text-sm">
        {[
          ["#demarrage", "Démarrage"],
          ["#auth", "Authentification"],
          ["#validate", "Endpoint /validate"],
          ["#reponse", "Réponse"],
          ["#email", "Intégration email & Gmail"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-border bg-card px-3 py-1 text-muted-foreground hover:text-foreground">
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-12">
        <Section id="demarrage" icon={Terminal} titre="Démarrage rapide">
          <p>
            Testez immédiatement avec la clé <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">demo</code>{" "}
            (fortement limitée). Envoyez les octets de la facture dans le corps de la requête :
          </p>
          <Code>{`curl -X POST https://VOTRE-DOMAINE/api/v1/validate \\
  -H "Authorization: Bearer demo" \\
  -H "Content-Type: application/xml" \\
  --data-binary @facture.xml`}</Code>
          <p className="text-sm text-muted-foreground">
            Pour un PDF Factur-X, utilisez <code className="font-mono">Content-Type: application/pdf</code> et{" "}
            <code className="font-mono">--data-binary @facture.pdf</code>.
          </p>
        </Section>

        <Section id="auth" icon={KeyRound} titre="Authentification">
          <p>
            Chaque requête porte une clé d'API dans l'en-tête{" "}
            <code className="font-mono">Authorization: Bearer &lt;clé&gt;</code> (ou{" "}
            <code className="font-mono">x-api-key: &lt;clé&gt;</code>). La clé{" "}
            <code className="font-mono">demo</code> fonctionne partout pour essayer ; vos clés de
            production se gèrent depuis votre compte (plan Pro / Cabinet).
          </p>
        </Section>

        <Section id="validate" icon={Terminal} titre="POST /api/v1/validate">
          <p>Deux façons d'envoyer la facture :</p>
          <p className="font-medium">1. Octets bruts (recommandé)</p>
          <Code>{`POST /api/v1/validate
Authorization: Bearer <clé>
Content-Type: application/pdf   (ou application/xml)

<octets de la facture>`}</Code>
          <p className="font-medium">2. Multipart (champ « fichier »)</p>
          <Code>{`curl -X POST https://VOTRE-DOMAINE/api/v1/validate \\
  -H "Authorization: Bearer demo" \\
  -F "fichier=@facture.pdf"`}</Code>
        </Section>

        <Section id="reponse" icon={Terminal} titre="Réponse">
          <Code>{`{
  "verdict": "conforme",
  "conforme": true,
  "exhaustif": true,
  "score": 100,
  "format": "CII",
  "profil": "EN 16931",
  "resume": { "reussis": 21, "avertissements": 0, "bloquants": 0 },
  "aCorriger": [],
  "erreur": null,
  "genereLe": "2026-01-15T10:00:00.000Z"
}`}</Code>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {CHAMPS.map(([champ, desc]) => (
                  <tr key={champ} className="align-top">
                    <td className="w-40 bg-muted/30 px-3 py-2 font-mono text-[13px] text-foreground">{champ}</td>
                    <td className="px-3 py-2 text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Codes&nbsp;: <code className="font-mono">200</code> analyse OK ·{" "}
            <code className="font-mono">401</code> clé absente/invalide ·{" "}
            <code className="font-mono">413</code> fichier &gt; 15 Mo ·{" "}
            <code className="font-mono">429</code> trop de requêtes (réessayez après{" "}
            <code className="font-mono">Retry-After</code>).
          </p>
        </Section>

        <Section id="email" icon={Mail} titre="Intégration email & Gmail">
          <p>
            Trois façons de brancher vos emails, de la plus simple à la plus automatisée :
          </p>
          <ul className="space-y-4">
            <li className="rounded-lg border border-border bg-card p-4">
              <p className="flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4 text-[hsl(var(--seal))]" aria-hidden="true" /> Transférer pour vérifier
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Transférez l'email contenant la facture à une adresse dédiée. Le webhook{" "}
                <code className="font-mono">/api/email/inbound</code> extrait la pièce jointe PDF/XML,
                l'analyse et renvoie le verdict. (Brancher un service de réception type SendGrid
                Inbound Parse ou Mailgun Routes vers ce webhook.)
              </p>
            </li>
            <li className="rounded-lg border border-border bg-card p-4">
              <p className="flex items-center gap-2 font-medium">
                <Zap className="h-4 w-4 text-[hsl(var(--seal))]" aria-hidden="true" /> Zapier / Make (no-code)
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                « Quand je reçois un email Gmail avec une pièce jointe » → appeler{" "}
                <code className="font-mono">POST /api/v1/validate</code> avec le fichier → recevoir le
                verdict (et répondre, archiver, alerter…). Aucune ligne de code.
              </p>
            </li>
            <li className="rounded-lg border border-border bg-card p-4">
              <p className="flex items-center gap-2 font-medium">
                <Terminal className="h-4 w-4 text-[hsl(var(--seal))]" aria-hidden="true" /> Dans votre logiciel
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Appelez l'API depuis votre outil de facturation ou votre ERP avant chaque envoi, pour
                bloquer les factures non conformes en amont.
              </p>
            </li>
          </ul>
        </Section>
      </div>

      <div className="mt-14 rounded-xl border border-border bg-muted/40 p-6 text-center">
        <p className="text-muted-foreground">Besoin d'une clé de production ou d'un volume élevé ?</p>
        <Link href="/tarifs" className="mt-2 inline-block font-medium text-foreground underline underline-offset-4">
          Voir les offres
        </Link>
      </div>
    </div>
  );
}
