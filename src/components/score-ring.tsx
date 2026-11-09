import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number; // 0..100
  conforme: boolean;
  size?: number;
  className?: string;
}

/** Anneau de score accessible : le chiffre est lisible, la couleur est indicative. */
export function ScoreRing({
  score,
  conforme,
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
        <span className="text-4xl font-bold tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
