"use client";

import * as React from "react";
import { Building2, User, FileCheck2, ArrowRight, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const [etape, setEtape] = React.useState(0);
  const [type, setType] = React.useState<"cabinet" | "entreprise" | null>(null);

  const etapes = [
    {
      titre: "Bienvenue 👋",
      sousTitre: "Qui êtes-vous ? Cela adapte votre espace.",
      contenu: (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { id: "cabinet" as const, Icon: Building2, t: "Cabinet comptable", d: "Je gère plusieurs clients." },
            { id: "entreprise" as const, Icon: User, t: "Entreprise / indépendant", d: "Je gère mes propres factures." },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => setType(o.id)}
              className={cn(
                "rounded-lg border-2 p-5 text-left transition-colors",
                type === o.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              )}
            >
              <o.Icon className="mb-3 h-7 w-7 text-primary" aria-hidden="true" />
              <p className="font-semibold">{o.t}</p>
              <p className="text-sm text-muted-foreground">{o.d}</p>
            </button>
          ))}
        </div>
      ),
      suivantActif: type !== null,
    },
    {
      titre: "Comment ça marche",
      sousTitre: "Trois étapes, moins de 10 secondes par facture.",
      contenu: (
        <ol className="space-y-3">
          {[
            "Déposez une facture (PDF Factur-X, UBL ou CII).",
            "FactuCheck teste chaque règle de conformité.",
            "Vous obtenez un score et les corrections à apporter.",
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <span className="text-sm">{t}</span>
            </li>
          ))}
        </ol>
      ),
      suivantActif: true,
    },
    {
      titre: "Tout est prêt",
      sousTitre: "Lancez votre premier test dès maintenant.",
      contenu: (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <FileCheck2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            Votre espace {type === "cabinet" ? "cabinet" : ""} est configuré.
          </p>
        </div>
      ),
      suivantActif: true,
    },
  ];

  const courant = etapes[etape];
  const dernier = etape === etapes.length - 1;

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="p-6">
        {/* Progression */}
        <div className="mb-6 flex gap-2">
          {etapes.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= etape ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <h1 className="text-2xl font-bold">{courant.titre}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{courant.sousTitre}</p>

        <div className="mb-8">{courant.contenu}</div>

        <div className="flex items-center justify-between">
          <Link href="/tableau-de-bord" className="text-sm text-muted-foreground hover:text-foreground">
            Passer
          </Link>
          {dernier ? (
            <Link href="/tester" className={buttonVariants()}>
              Tester une facture
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <Button
              disabled={!courant.suivantActif}
              onClick={() => setEtape((e) => e + 1)}
            >
              Continuer
              <Check className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
