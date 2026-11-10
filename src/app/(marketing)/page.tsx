import Link from "next/link";
import {
  ChevronDown,
  Upload,
  ScanLine,
  PenLine,
  ShieldCheck,
  MessageSquareText,
  Building2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreRing } from "@/components/score-ring";
import { StatutBadge } from "@/components/statut-badge";
import { TarifsGrid } from "@/components/tarifs-grid";
import { dict } from "@/lib/i18n";
import type { StatutFinding } from "@/lib/engine/types";

const ETAPE_ICONS = [Upload, ScanLine, PenLine];
const AVANTAGE_ICONS = [ShieldCheck, MessageSquareText, Building2];

const APERCU: { t: string; statut: StatutFinding }[] = [
  { t: "Cohérence HT + TVA = TTC", statut: "reussi" },
  { t: "SIREN du client présent", statut: "reussi" },
  { t: "Adresse de livraison", statut: "avertissement" },
];

const FAQ = [
  {
    q: "Quels formats sont acceptés ?",
    r: "Factur-X (PDF/A-3 contenant un XML), ainsi que les formats XML UBL et CII, à l'unité ou par lot.",
  },
  {
    q: "Faut-il créer un compte pour tester ?",
    r: "Non. Votre premier test est possible sans compte. La création d'un compte débloque l'historique, les dossiers clients et l'export.",
  },
  {
    q: "Mes factures sont-elles conservées ?",
    r: "Les fichiers sont chiffrés et supprimés automatiquement après 30 jours (durée réglable). L'hébergement est situé en Union européenne.",
  },
  {
    q: "Les règles de contrôle sont-elles officielles ?",
    r: dict.legal.avertissementRegles,
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container grid items-center gap-12 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Réforme de la facturation électronique
            </span>
            <h1 className="max-w-[16ch] text-4xl font-semibold leading-[1.08] md:text-6xl">
              {dict.promesse}
            </h1>
            <p className="max-w-prose text-lg text-muted-foreground">
              {dict.sousPromesse} Déposez une facture, obtenez un verdict clair et
              les corrections précises — avant de la transmettre.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/tester" className={buttonVariants({ size: "lg" })}>
                {dict.landing.ctaPrincipal}
              </Link>
              <Link href="/tarifs" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {dict.landing.ctaSecondaire}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">{dict.landing.sansCompte}</p>
          </div>

          {/* Aperçu du verdict */}
          <Card className="print-break-avoid">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <ScoreRing score={92} conforme size={120} />
                <div>
                  <p className="font-display text-2xl font-semibold text-success">
                    {dict.statut.conforme}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    facture-2026-0148 · Factur-X
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                {APERCU.map((row) => (
                  <div
                    key={row.t}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 text-sm"
                  >
                    <span>{row.t}</span>
                    <StatutBadge statut={row.statut} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Démo 3 étapes */}
      <section id="produit" className="container py-16 md:py-24">
        <h2 className="mb-12 max-w-[20ch] text-3xl font-semibold md:text-4xl">
          {dict.landing.demoTitre}
        </h2>
        <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {dict.landing.etapes.map((etape, i) => {
            const Icon = ETAPE_ICONS[i];
            return (
              <li key={etape.titre} className="bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-sm font-semibold text-muted-foreground tabular">
                    Étape {i + 1}
                  </span>
                </div>
                <h3 className="mb-1.5 text-lg font-semibold">{etape.titre.replace(/^\d+\.\s*/, "")}</h3>
                <p className="text-sm text-muted-foreground">{etape.texte}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Avantages */}
      <section className="border-y border-border bg-muted/30">
        <div className="container py-16 md:py-24">
          <h2 className="mb-12 text-3xl font-semibold md:text-4xl">
            {dict.landing.avantagesTitre}
          </h2>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-3">
            {dict.landing.avantages.map((av, i) => {
              const Icon = AVANTAGE_ICONS[i];
              return (
                <div key={av.titre} className="border-t-2 border-primary/70 pt-4">
                  <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mb-1.5 text-lg font-semibold">{av.titre}</h3>
                  <p className="text-sm text-muted-foreground">{av.texte}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="container py-16 md:py-24">
        <div className="mb-12">
          <h2 className="text-3xl font-semibold md:text-4xl">{dict.landing.tarifsTitre}</h2>
          <p className="mt-2 text-muted-foreground">{dict.landing.tarifsSousTitre}</p>
        </div>
        <TarifsGrid />
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/30">
        <div className="container max-w-3xl py-16 md:py-24">
          <h2 className="mb-10 text-3xl font-semibold md:text-4xl">{dict.landing.faqTitre}</h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium">
                  {item.q}
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="max-w-prose pb-4 text-sm text-muted-foreground">{item.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="container py-16 md:py-24">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-start gap-5 p-8 md:flex-row md:items-center md:justify-between md:p-10">
            <div>
              <h2 className="text-2xl font-semibold text-primary-foreground md:text-3xl">
                Prêt à éliminer les rejets ?
              </h2>
              <p className="mt-2 text-primary-foreground/75">
                Testez une facture maintenant. Résultat en moins de 10 secondes.
              </p>
            </div>
            <Link
              href="/tester"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-background px-7 font-medium text-foreground transition-opacity hover:opacity-90"
            >
              {dict.landing.ctaPrincipal}
            </Link>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
