"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import type { StatutFinding } from "@/lib/engine/types";
import { ScoreRing } from "@/components/score-ring";
import { StatutBadge } from "@/components/statut-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Controle {
  label: string;
  statut: StatutFinding;
  detail?: string;
}
interface Scene {
  nom: string;
  format: string;
  profil?: string;
  score: number;
  conforme: boolean;
  controles: Controle[];
}

const SCENES: Record<"conforme" | "corriger", Scene> = {
  conforme: {
    nom: "facture-2026-0148.pdf",
    format: "Factur-X",
    profil: "EN 16931",
    score: 100,
    conforme: true,
    controles: [
      { label: "Format reconnu et profil valide", statut: "reussi" },
      { label: "SIREN du client présent", statut: "reussi" },
      { label: "Cohérence HT + TVA = TTC", statut: "reussi", detail: "1 000,00 € + 200,00 € = 1 200,00 €" },
      { label: "Date d'émission valide", statut: "reussi" },
      { label: "Numéro de facture conforme", statut: "reussi" },
    ],
  },
  corriger: {
    nom: "facture-2026-0147.xml",
    format: "UBL",
    score: 54,
    conforme: false,
    controles: [
      { label: "Format reconnu et profil valide", statut: "reussi" },
      { label: "SIREN du client présent", statut: "bloquant", detail: "Le SIREN du client est absent." },
      { label: "Cohérence HT + TVA = TTC", statut: "bloquant", detail: "1 000,00 € + 200,00 € ≠ 1 150,00 €" },
      { label: "Adresse de livraison", statut: "avertissement", detail: "Absente alors qu'elle diffère de la facturation." },
      { label: "Numéro de facture conforme", statut: "reussi" },
    ],
  },
};

export function HeroDemo() {
  const [mode, setMode] = React.useState<"conforme" | "corriger">("conforme");
  const [revele, setRevele] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [termine, setTermine] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervals = React.useRef<ReturnType<typeof setInterval>[]>([]);

  const scene = SCENES[mode];

  const nettoyer = React.useCallback(() => {
    timers.current.forEach(clearTimeout);
    intervals.current.forEach(clearInterval);
    timers.current = [];
    intervals.current = [];
  }, []);

  React.useEffect(() => {
    nettoyer();
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setProgress(100);
      setRevele(scene.controles.length);
      setScore(scene.score);
      setTermine(true);
      return nettoyer;
    }

    setTermine(false);
    setScore(0);
    setRevele(0);
    setProgress(0);
    timers.current.push(setTimeout(() => setProgress(100), 60));
    scene.controles.forEach((_, i) =>
      timers.current.push(setTimeout(() => setRevele(i + 1), 320 + i * 280)),
    );
    const fin = 320 + scene.controles.length * 280 + 220;
    timers.current.push(
      setTimeout(() => {
        setTermine(true);
        let cur = 0;
        const pas = Math.max(1, Math.round(scene.score / 24));
        const id = setInterval(() => {
          cur = Math.min(scene.score, cur + pas);
          setScore(cur);
          if (cur >= scene.score) clearInterval(id);
        }, 28);
        intervals.current.push(id);
      }, fin),
    );
    return nettoyer;
  }, [mode, scene, nettoyer, tick]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-[0_2px_20px_rgba(16,34,51,0.07)]">
      {/* Sélecteur d'exemple */}
      <div
        role="tablist"
        aria-label="Exemple de facture"
        className="flex gap-1 border-b border-border p-1.5"
      >
        {(["conforme", "corriger"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {m === "conforme" ? "Facture correcte" : "Facture à corriger"}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* Verdict */}
        <div className="flex items-center gap-4">
          <ScoreRing score={score} conforme={scene.conforme} size={92} />
          <div className="min-w-0">
            <p
              className={cn(
                "font-display text-xl font-semibold transition-colors",
                termine
                  ? scene.conforme
                    ? "text-success"
                    : "text-danger"
                  : "text-muted-foreground",
              )}
              aria-live="polite"
            >
              {termine ? (scene.conforme ? "Conforme" : "Non conforme") : "Analyse…"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{scene.nom}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge tone="neutral">{scene.format}</Badge>
              {scene.profil && <Badge tone="primary">{scene.profil}</Badge>}
            </div>
          </div>
        </div>

        {/* Barre de progression (pendant l'analyse) */}
        <div
          className={cn(
            "mt-4 h-1 overflow-hidden rounded-full bg-muted transition-opacity",
            termine && "opacity-0",
          )}
          role="progressbar"
          aria-valuenow={progress}
          aria-label="Progression de l'analyse"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progress}%`, transition: "width 1.5s ease" }}
          />
        </div>

        {/* Contrôles révélés un à un */}
        <ul className="mt-4 space-y-1.5">
          {scene.controles.map((c, i) => (
            <li
              key={c.label}
              className={cn(
                "rounded-md border border-border px-3 py-2 transition-all duration-300",
                i < revele ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{c.label}</span>
                <StatutBadge statut={c.statut} />
              </div>
              {c.detail && i < revele && (
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    c.statut === "bloquant"
                      ? "text-danger"
                      : c.statut === "avertissement"
                        ? "text-warning"
                        : "text-muted-foreground",
                  )}
                >
                  {c.detail}
                </p>
              )}
            </li>
          ))}
        </ul>

        {termine && (
          <button
            onClick={() => setTick((t) => t + 1)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Rejouer l'analyse
          </button>
        )}
      </div>
    </div>
  );
}
