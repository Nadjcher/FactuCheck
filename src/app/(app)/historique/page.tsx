"use client";

import * as React from "react";
import { Search, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatutBadge } from "@/components/statut-badge";
import { DEMO_FACTURES } from "@/lib/demo-data";
import { formaterDateHeure } from "@/lib/format";

export default function HistoriquePage() {
  const [q, setQ] = React.useState("");
  const [statut, setStatut] = React.useState<"tous" | "conforme" | "non_conforme">("tous");

  const resultats = DEMO_FACTURES.filter((f) => {
    const matchTexte =
      q === "" ||
      f.nom.toLowerCase().includes(q.toLowerCase()) ||
      f.clientNom.toLowerCase().includes(q.toLowerCase());
    const matchStatut = statut === "tous" || f.statut === statut;
    return matchTexte && matchStatut;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historique</h1>
        <p className="text-sm text-muted-foreground">
          Retrouvez et recherchez toutes vos factures testées.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par facture ou client…"
            className="pl-9"
            aria-label="Rechercher"
          />
        </div>
        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value as typeof statut)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filtrer par statut"
        >
          <option value="tous">Tous les statuts</option>
          <option value="conforme">Conformes</option>
          <option value="non_conforme">Non conformes</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {resultats.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Aucune facture ne correspond à votre recherche.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-4 font-medium">Facture</th>
                    <th className="p-4 font-medium">Client</th>
                    <th className="p-4 font-medium">Format</th>
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium">Statut</th>
                    <th className="p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {resultats.map((f) => (
                    <tr key={f.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-4 font-medium">{f.nom}</td>
                      <td className="p-4 text-muted-foreground">{f.clientNom}</td>
                      <td className="p-4">
                        <Badge tone="neutral">{f.format}</Badge>
                      </td>
                      <td className="p-4 tabular-nums">{f.score}</td>
                      <td className="p-4">
                        <StatutBadge statut={f.statut === "conforme" ? "reussi" : "bloquant"} />
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formaterDateHeure(f.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
