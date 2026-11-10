import Link from "next/link";
import {
  ChevronDown,
  Upload,
  ScanLine,
  PenLine,
  ShieldCheck,
  MessageSquareText,
  Building2,
  FileType2,
  ListChecks,
  Calculator,
  CalendarClock,
  FileText,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroDemo } from "@/components/landing/hero-demo";
import { TarifsGrid } from "@/components/tarifs-grid";
import { dict } from "@/lib/i18n";

const ETAPE_ICONS = [Upload, ScanLine, PenLine];
const AVANTAGE_ICONS = [ShieldCheck, MessageSquareText, Building2];

const FORMATS = ["Factur-X", "UBL", "CII", "PDF/A-3", "EN 16931", "EXTENDED-CTC-FR"];

const VERIFS = [
  { Icon: FileType2, t: "Format et profil", d: "Factur-X, UBL ou CII, et un profil accepté par les plateformes." },
  { Icon: ListChecks, t: "Mentions obligatoires", d: "SIREN émetteur et client, TVA, adresse de livraison, nature de l'opération." },
  { Icon: Calculator, t: "Montants", d: "HT, TVA et TTC cohérents — au total, par taux et au niveau de chaque ligne." },
  { Icon: CalendarClock, t: "Dates et numérotation", d: "Date d'émission valide, numéro unique, continu et exploitable." },
  { Icon: FileText, t: "Conteneur PDF", d: "PDF/A-3, XML embarqué nommé factur-x.xml, métadonnées cohérentes." },
  { Icon: ShieldCheck, t: "Règles officielles", d: "Validation par les schematrons EN 16931 et FNFE-MPE (EXTENDED-CTC-FR)." },
];

const FAQ = [
  { q: "Quels formats sont acceptés ?", r: "Factur-X (PDF/A-3 contenant un XML), ainsi que les formats XML UBL et CII, à l'unité ou par lot." },
  { q: "Faut-il créer un compte pour tester ?", r: "Non. Votre premier test est possible sans compte. La création d'un compte débloque l'historique, les dossiers clients et l'export." },
  { q: "Mes factures sont-elles conservées ?", r: "Les fichiers sont chiffrés et supprimés automatiquement après 30 jours (durée réglable). L'hébergement est situé en Union européenne." },
  { q: "Les règles de contrôle sont-elles officielles ?", r: dict.legal.avertissementRegles },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container grid items-center gap-12 py-14 lg:grid-cols-[1fr_minmax(380px,460px)] lg:py-20">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Réforme de la facturation électronique
            </span>
            <h1 className="max-w-[15ch] text-4xl font-semibold leading-[1.05] md:text-6xl">
              {dict.promesse}
            </h1>
            <p className="max-w-prose text-lg text-muted-foreground">
              {dict.sousPromesse} Déposez une facture, voyez le verdict se former en
              direct — et corrigez avant de l'envoyer.
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

          <div className="lg:justify-self-end">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* Compatibilité */}
      <section className="border-b border-border bg-muted/40">
        <div className="container flex flex-col items-start gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium">
            Compatible sur toute la chaîne.{" "}
            <span className="font-normal text-muted-foreground">
              Formats agréés et validation par règles officielles.
            </span>
          </p>
          <ul className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <li key={f}>
                <Badge tone="neutral" className="text-[13px]">{f}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3 étapes */}
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

      {/* Ce que FactuCheck vérifie */}
      <section className="border-y border-border bg-muted/30">
        <div className="container py-16 md:py-24">
          <div className="mb-12 max-w-prose">
            <h2 className="text-3xl font-semibold md:text-4xl">Ce que FactuCheck vérifie</h2>
            <p className="mt-3 text-muted-foreground">
              Chaque contrôle est expliqué en français simple, avec la correction à
              apporter. Vous comprenez le résultat, même sans connaître la norme.
            </p>
          </div>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {VERIFS.map(({ Icon, t, d }) => (
              <div key={t} className="border-t-2 border-primary/70 pt-4">
                <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mb-1.5 text-lg font-semibold">{t}</h3>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="container py-16 md:py-24">
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
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="border-t border-border bg-muted/30">
        <div className="container py-16 md:py-24">
          <div className="mb-12">
            <h2 className="text-3xl font-semibold md:text-4xl">{dict.landing.tarifsTitre}</h2>
            <p className="mt-2 text-muted-foreground">{dict.landing.tarifsSousTitre}</p>
          </div>
          <TarifsGrid />
        </div>
      </section>

      {/* FAQ */}
      <section className="container max-w-3xl py-16 md:py-24">
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
      </section>

      {/* CTA final */}
      <section className="container pb-20">
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
