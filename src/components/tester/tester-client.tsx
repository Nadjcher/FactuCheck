"use client";

import * as React from "react";
import Link from "next/link";
import { UploadCloud, FileText, X, Sparkles, Printer, RotateCcw } from "lucide-react";
import type { Report } from "@/lib/engine/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RapportVue } from "@/components/rapport/rapport-vue";
import { dict } from "@/lib/i18n";

interface Resultat {
  nom: string;
  report?: Report;
  erreur?: string;
}

type Phase = "depot" | "analyse" | "resultats";

export function TesterClient() {
  const [phase, setPhase] = React.useState<Phase>("depot");
  const [fichiers, setFichiers] = React.useState<File[]>([]);
  const [progress, setProgress] = React.useState(0);
  const [resultats, setResultats] = React.useState<Resultat[]>([]);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function ajouter(liste: FileList | File[]) {
    const arr = Array.from(liste);
    setFichiers((prev) => [...prev, ...arr].slice(0, 50));
    setErreur(null);
  }

  function retirer(i: number) {
    setFichiers((prev) => prev.filter((_, idx) => idx !== i));
  }

  function analyser(liste: File[]) {
    if (liste.length === 0) return;
    setPhase("analyse");
    setProgress(8);
    setErreur(null);

    const fd = new FormData();
    liste.forEach((f) => fd.append("fichiers", f));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/analyser");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.min(55, (e.loaded / e.total) * 55));
    };
    // Progression simulée pendant le traitement serveur (< 10 s).
    const creep = setInterval(() => {
      setProgress((p) => (p < 92 ? p + 4 : p));
    }, 180);

    xhr.onload = () => {
      clearInterval(creep);
      setProgress(100);
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.erreur) {
          setErreur(data.erreur);
          setPhase("depot");
          return;
        }
        setResultats(data.resultats);
        setTimeout(() => setPhase("resultats"), 250);
      } catch {
        setErreur("Réponse du serveur illisible.");
        setPhase("depot");
      }
    };
    xhr.onerror = () => {
      clearInterval(creep);
      setErreur("La connexion a échoué. Réessayez.");
      setPhase("depot");
    };
    xhr.send(fd);
  }

  async function essayerExemple() {
    try {
      const res = await fetch("/api/exemple");
      const xml = await res.text();
      const file = new File([xml], "facture-exemple-factur-x.xml", {
        type: "application/xml",
      });
      analyser([file]);
    } catch {
      setErreur("Impossible de charger la facture d'exemple.");
    }
  }

  function recommencer() {
    setPhase("depot");
    setFichiers([]);
    setResultats([]);
    setProgress(0);
    setErreur(null);
  }

  // ---- Rendu -------------------------------------------------------------
  if (phase === "resultats") {
    return (
      <div className="space-y-8">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Résultat de l'analyse</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              {dict.commun.exporterPdf}
            </Button>
            <Button variant="secondary" onClick={recommencer}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {dict.commun.recommencer}
            </Button>
          </div>
        </div>
        {resultats.map((r, i) => (
          <div key={i}>
            {r.report ? (
              <RapportVue nom={r.nom} report={r.report} />
            ) : (
              <Card>
                <CardContent className="p-4 text-sm">
                  <p className="font-medium">{r.nom}</p>
                  <p className="text-danger">{r.erreur}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
        <div className="no-print rounded-lg border border-border bg-muted/40 p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Créez un compte pour conserver l'historique, gérer vos dossiers clients
            et exporter vos rapports.
          </p>
          <Link href="/inscription" className={buttonVariants() + " mt-3"}>
            {dict.nav.inscription}
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "analyse") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mb-6 inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold">{dict.commun.chargement}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Résultat en moins de 10 secondes.
        </p>
        <div
          className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm tabular-nums text-muted-foreground">
          {Math.round(progress)} %
        </p>
      </div>
    );
  }

  // phase === "depot"
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Tester une facture</h1>
        <p className="mt-2 text-muted-foreground">
          Aucune inscription requise. Déposez une ou plusieurs factures.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) ajouter(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <UploadCloud className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <p className="text-lg font-medium">{dict.commun.deposer}</p>
        <p className="mt-1 text-sm text-muted-foreground">{dict.commun.deposerAide}</p>
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            {dict.commun.parcourir}
          </Button>
          <Button variant="ghost" onClick={essayerExemple}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {dict.commun.testerExemple}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.xml,application/pdf,application/xml,text/xml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) ajouter(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {erreur && (
        <p className="mt-4 rounded-md border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
          {erreur}
        </p>
      )}

      {fichiers.length > 0 && (
        <div className="mt-6 space-y-2">
          {fichiers.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{f.name}</span>
              </span>
              <button
                onClick={() => retirer(i)}
                className="text-muted-foreground hover:text-danger"
                aria-label={`Retirer ${f.name}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <Button className="w-full" size="lg" onClick={() => analyser(fichiers)}>
            Analyser {fichiers.length > 1 ? `${fichiers.length} factures` : "la facture"}
          </Button>
        </div>
      )}
    </div>
  );
}
