import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number; // 0..100
  conforme: boolean;
  exhaustif?: boolean;
  size?: number;
  className?: string;
}

/** Anneau de score accessible : le chiffre est lisible, la couleur est indicative. */
export function ScoreRing({
  score,
  conforme,
  exhaustif = true,
  size = 180,
  className,
}: ScoreRingProps) {
  const stroke = size * 0.1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;

  // Couleur : vert si conforme & score élevé, orange si moyen, rouge sinon.
  const couleur = !conforme
    ? "hsl(var(--danger))"
    : !exhaustif
      ? "hsl(var(--warning))"
      : pct >= 80
        ? "hsl(var(--success))"
        : "hsl(var(--warning))";

  return (
    <div
      className={cn("relative inline-flex", className)}
      role="img"
      aria-label={`Score de conformité : ${score} sur 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={couleur}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 900ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-semibold tabular-nums leading-none">{score}</span>
        <span className="mt-1 text-xs font-medium text-muted-foreground">sur 100</span>
      </div>
    </div>
  );
}
