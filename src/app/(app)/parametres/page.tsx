"use client";

import * as React from "react";
import { CreditCard, KeyRound, ShieldAlert, Download, Trash2, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";
import { dict } from "@/lib/i18n";

export default function ParametresPage() {
  const [retention, setRetention] = React.useState(30);
  const [copie, setCopie] = React.useState(false);
  const [planEnCours, setPlanEnCours] = React.useState<string | null>(null);
  const [infoPaiement, setInfoPaiement] = React.useState<string | null>(null);
  const cle = "fc_live_sk_4b9f2e1a7c8d0000demo";

  async function gererAbonnement(planId: string) {
    setPlanEnCours(planId);
    setInfoPaiement(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setInfoPaiement(data.erreur ?? "Paiement indisponible.");
      }
    } catch {
      setInfoPaiement("Le paiement a échoué.");
    } finally {
      setPlanEnCours(null);
    }
  }

  function exporter() {
    const blob = new Blob([JSON.stringify({ export: "donnees-factucheck", date: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export-factucheck.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      {/* Abonnement */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
            Abonnement &amp; facturation
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Offre actuelle : <Badge tone="primary">Gratuit</Badge>
          </p>
          <div className="flex flex-wrap gap-2">
            {PLANS.filter((p) => p.id !== "gratuit").map((p) => (
              <Button
                key={p.id}
                variant="outline"
                disabled={planEnCours === p.id}
                onClick={() => gererAbonnement(p.id)}
              >
                {planEnCours === p.id ? "Redirection…" : p.cta}
              </Button>
            ))}
          </div>
          {infoPaiement && (
            <p className="mt-3 rounded-md border border-warning/40 bg-warning-soft p-2.5 text-xs text-warning">
              {infoPaiement}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Clé API */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
            Clé API
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Intégrez FactuCheck à votre logiciel métier via l'API REST.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={cle} className="font-mono text-xs" />
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(cle);
                setCopie(true);
                setTimeout(() => setCopie(false), 1500);
              }}
            >
              {copie ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copie ? "Copiée" : "Copier"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rétention */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 text-lg font-semibold">Conservation des fichiers</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Les factures sont chiffrées puis supprimées automatiquement après ce délai.
          </p>
          <div className="flex items-center gap-3">
            <Label htmlFor="retention">Supprimer après</Label>
            <Input
              id="retention"
              type="number"
              min={1}
              max={365}
              value={retention}
              onChange={(e) => setRetention(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">jours</span>
          </div>
        </CardContent>
      </Card>

      {/* RGPD */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <ShieldAlert className="h-5 w-5 text-primary" aria-hidden="true" />
            Mes données (RGPD)
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Exercez vos droits d'accès et d'effacement à tout moment.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exporter}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Exporter mes données
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm("Supprimer définitivement toutes vos données ? Cette action est irréversible.")) {
                  alert("Demande de suppression enregistrée (démonstration).");
                }
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Supprimer mon compte
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{dict.legal.avertissementRegles}</p>
        </CardContent>
      </Card>
    </div>
  );
}
