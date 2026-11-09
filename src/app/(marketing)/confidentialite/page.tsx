import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confidentialité & RGPD" };

const SECTIONS = [
  {
    t: "Hébergement en Union européenne",
    p: "Vos fichiers et données sont hébergés exclusivement au sein de l'Union européenne.",
  },
  {
    t: "Chiffrement et conservation",
    p: "Les factures déposées sont chiffrées. Elles sont supprimées automatiquement après 30 jours (durée réglable dans vos paramètres).",
  },
  {
    t: "Vos droits",
    p: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. L'export et la suppression sont disponibles depuis vos paramètres.",
  },
  {
    t: "Journal d'audit",
    p: "Les accès, exports et suppressions de données sont journalisés pour assurer la traçabilité.",
  },
  {
    t: "Sous-traitants",
    p: "Les prestataires techniques (hébergement, paiement) sont encadrés par des accords conformes au RGPD. [Liste à compléter].",
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        Confidentialité &amp; RGPD
      </h1>
      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.t}>
            <h2 className="mb-2 text-lg font-semibold">{s.t}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
        <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Document d'information synthétique. La politique de confidentialité
          complète (responsable de traitement, bases légales, durées détaillées,
          coordonnées du DPO) est à finaliser avant mise en production.
        </p>
      </div>
    </div>
  );
}
