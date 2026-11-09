import { UserPlus, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_CLIENTS, DEMO_MEMBRES } from "@/lib/demo-data";

const ROLE_LABEL: Record<string, { label: string; tone: "primary" | "neutral" | "success" }> = {
  admin: { label: "Administrateur", tone: "primary" },
  collaborateur: { label: "Collaborateur", tone: "neutral" },
  client_lecture: { label: "Client (lecture seule)", tone: "success" },
};

export const metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dossiers clients</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les dossiers de votre cabinet et les accès.
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Ajouter un dossier
        </Button>
      </div>

      {/* Dossiers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_CLIENTS.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold">{c.nom}</span>
                <Badge
                  tone={c.tauxConformite >= 85 ? "success" : c.tauxConformite >= 70 ? "warning" : "danger"}
                >
                  {c.tauxConformite} %
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">SIREN {c.siren}</p>
              <p className="mt-2 text-sm">
                {c.facturesTestees} factures testées
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Membres & rôles */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
            Membres &amp; rôles
          </h2>
          <ul className="divide-y divide-border">
            {DEMO_MEMBRES.map((m) => {
              const r = ROLE_LABEL[m.role];
              return (
                <li key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{m.nom}</p>
                    <p className="text-sm text-muted-foreground">{m.email}</p>
                  </div>
                  <Badge tone={r.tone}>
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {r.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
