import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formaterEuro } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TarifsGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLANS.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "flex flex-col p-6",
            plan.populaire && "ring-2 ring-primary",
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">{plan.nom}</h3>
            {plan.populaire && <Badge tone="primary">Le plus choisi</Badge>}
          </div>
          <div className="mb-1 flex items-baseline gap-1">
            <span className="text-4xl font-bold tabular-nums">
              {plan.prix === 0 ? "0 €" : formaterEuro(plan.prix)}
            </span>
            {plan.prix > 0 && (
              <span className="text-sm text-muted-foreground">/ mois HT</span>
            )}
          </div>
          <p className="mb-1 text-sm font-medium">{plan.quota}</p>
          <p className="mb-5 text-sm text-muted-foreground">{plan.cible}</p>
          <ul className="mb-6 flex-1 space-y-2.5 text-sm">
            {plan.avantages.map((a) => (
              <li key={a} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
          <Link
            href={plan.id === "gratuit" ? "/inscription" : `/inscription?plan=${plan.id}`}
            className={buttonVariants({
              variant: plan.populaire ? "primary" : "outline",
            })}
          >
            {plan.cta}
          </Link>
        </Card>
      ))}
    </div>
  );
}
