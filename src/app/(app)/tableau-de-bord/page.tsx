"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingUp, FileCheck2, Gauge, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatutBadge } from "@/components/statut-badge";
import {
  DEMO_CLIENTS,
  DEMO_FACTURES,
  DEMO_STATS,
  DEMO_TOP_CAUSES,
  DEMO_EVOLUTION,
} from "@/lib/demo-data";
import { formaterDateHeure } from "@/lib/format";

export default function TableauDeBordPage() {
  const [clientId, setClientId] = React.useState<string>("tous");

  const client = DEMO_CLIENTS.find((c) => c.id === clientId);
  const factures =
    clientId === "tous"
      ? DEMO_FACTURES
      : DEMO_FACTURES.filter((f) => f.clientId === clientId);

  const taux = client ? client.tauxConformite : DEMO_STATS.tauxConformite;
  const testees = client ? client.facturesTestees : DEMO_STATS.facturesTestees;
  const maxEvo = Math.max(...DEMO_EVOLUTION);
  const maxCause = Math.max(...DEMO_TOP_CAUSES.map((c) => c.occurrences));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Suivi de la conformité de vos factures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="filtre-client" className="text-sm text-muted-foreground">
            Client
          </label>
          <select
            id="filtre-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="tous">Tous les clients</option>
            {DEMO_CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
          <Link href="/tester" className={buttonVariants({ size: "sm" })}>
            Tester une facture
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          Icon={Gauge}
          label="Taux de conformité"
          valeur={`${taux} %`}
          tone={taux >= 85 ? "success" : taux >= 70 ? "warning" : "danger"}
        />
        <StatTile Icon={FileCheck2} label="Factures testées" valeur={String(testees)} />
        <StatTile
          Icon={TrendingUp}
          label="Ce mois"
          valeur={`${DEMO_STATS.facturesCeMois} / ${DEMO_STATS.quotaMois}`}
          sous={`${Math.round((DEMO_STATS.facturesCeMois / DEMO_STATS.quotaMois) * 100)} % du quota`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Évolution */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Évolution du taux de conformité
            </h2>
            <div
              className="flex h-40 items-end gap-1.5"
              role="img"
              aria-label="Évolution du taux de conformité sur les 12 dernières semaines"
            >
              {DEMO_EVOLUTION.map((v, i) => (
                <div key={i} className="flex h-full flex-1 flex-col justify-end">
                  <div
                    className="w-full rounded-t bg-primary"
                    style={{ height: `${(v / maxEvo) * 100}%` }}
                    title={`Semaine ${i + 1} : ${v} %`}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">12 dernières semaines</p>
          </CardContent>
        </Card>

        {/* Top 5 causes */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Top 5 des causes d'erreur</h2>
            <ul className="space-y-3">
              {DEMO_TOP_CAUSES.map((c) => (
                <li key={c.ruleId}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <StatutBadge statut={c.statut} />
                      {c.libelle}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {c.occurrences}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={
                        c.statut === "bloquant" ? "h-full bg-danger" : "h-full bg-warning"
                      }
                      style={{ width: `${(c.occurrences / maxCause) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Factures récentes */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Factures récentes</h2>
            <Link
              href="/historique"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Tout l'historique
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Facture</th>
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium">Format</th>
                  <th className="pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => (
                  <tr key={f.id} className="border-b border-border/60">
                    <td className="py-2.5 font-medium">{f.nom}</td>
                    <td className="py-2.5 text-muted-foreground">{f.clientNom}</td>
                    <td className="py-2.5">
                      <Badge tone="neutral">{f.format}</Badge>
                    </td>
                    <td className="py-2.5 tabular-nums">{f.score}</td>
                    <td className="py-2.5">
                      <StatutBadge statut={f.statut === "conforme" ? "reussi" : "bloquant"} />
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {formaterDateHeure(f.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  Icon,
  label,
  valeur,
  sous,
  tone = "primary",
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  valeur: string;
  sous?: string;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className={`h-4 w-4 ${toneClass}`} />
          {label}
        </div>
        <p className={`text-3xl font-bold tabular-nums ${toneClass}`}>{valeur}</p>
        {sous && <p className="mt-1 text-xs text-muted-foreground">{sous}</p>}
      </CardContent>
    </Card>
  );
}
