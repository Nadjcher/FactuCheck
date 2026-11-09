import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import type { StatutFinding } from "@/lib/engine/types";
import { Badge } from "@/components/ui/badge";
import { dict } from "@/lib/i18n";

// La couleur est TOUJOURS doublée d'une icône + d'un libellé (accessibilité).
const MAP = {
  reussi: { tone: "success" as const, Icon: CheckCircle2, label: dict.statut.reussi },
  avertissement: {
    tone: "warning" as const,
    Icon: AlertTriangle,
    label: dict.statut.avertissement,
  },
  bloquant: { tone: "danger" as const, Icon: XCircle, label: dict.statut.bloquant },
  non_applicable: {
    tone: "neutral" as const,
    Icon: MinusCircle,
    label: dict.statut.non_applicable,
  },
};

export function StatutBadge({ statut }: { statut: StatutFinding }) {
  const { tone, Icon, label } = MAP[statut];
  return (
    <Badge tone={tone}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}
