import Link from "next/link";
import {
  ArrowRight,
  Upload,
  ScanLine,
  Wrench,
  ShieldCheck,
  MessageSquareText,
  Building2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TarifsGrid } from "@/components/tarifs-grid";
import { dict } from "@/lib/i18n";

const ETAPE_ICONS = [Upload, ScanLine, Wrench];
const AVANTAGE_ICONS = [ShieldCheck, MessageSquareText, Building2];

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
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Réforme de la facturation électronique
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {dict.promesse}
              <span className="block text-primary">{dict.sousPromesse}</span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Détectez les erreurs qui provoquent un rejet — avant de transmettre
              votre facture. Un score clair, des corrections concrètes.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/tester" className={buttonVariants({ size: "lg" })}>
                {dict.landing.ctaPrincipal}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/tarifs"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                {dict.landing.ctaSecondaire}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">{dict.landing.sansCompte}</p>
          </div>

          {/* Aperçu visuel du score */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score de conformité</p>
                <p className="text-5xl font-bold tabular-nums text-success">92</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-success-soft" />
            </div>
            <div className="mt-6 space-y-3">
              {[
                { t: "Cohérence des montants", s: "success", l: "Réussi" },
                { t: "SIREN client présent", s: "success", l: "Réussi" },
                { t: "Adresse de livraison", s: "warning", l: "Avertissement" },
              ].map((row) => (
                <div
                  key={row.t}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <span>{row.t}</span>
                  <span
                    className={
                      row.s === "success"
                        ? "text-success font-medium"
                        : "text-warning font-medium"
                    }
                  >
                    {row.l}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Démo 3 étapes */}
      <section id="produit" className="container py-16 md:py-24">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
          {dict.landing.demoTitre}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {dict.landing.etapes.map((etape, i) => {
            const Icon = ETAPE_ICONS[i];
            return (
              <Card key={etape.titre} className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{etape.titre}</h3>
                <p className="text-sm text-muted-foreground">{etape.texte}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Avantages */}
      <section className="border-y border-border bg-muted/30">
        <div className="container py-16 md:py-24">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            {dict.landing.avantagesTitre}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {dict.landing.avantages.map((av, i) => {
              const Icon = AVANTAGE_ICONS[i];
              return (
                <div key={av.titre} className="text-center">
                  <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{av.titre}</h3>
                  <p className="text-sm text-muted-foreground">{av.texte}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="container py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{dict.landing.tarifsTitre}</h2>
          <p className="mt-2 text-muted-foreground">{dict.landing.tarifsSousTitre}</p>
        </div>
        <TarifsGrid />
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/30">
        <div className="container max-w-3xl py-16 md:py-24">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">
            {dict.landing.faqTitre}
          </h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-border bg-card p-5"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {item.q}
                  <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="container py-16 text-center md:py-24">
        <h2 className="text-3xl font-bold tracking-tight">
          Prêt à éliminer les rejets ?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Testez une facture maintenant. Résultat en moins de 10 secondes.
        </p>
        <Link
          href="/tester"
          className={buttonVariants({ size: "lg" }) + " mt-6"}
        >
          {dict.landing.ctaPrincipal}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
