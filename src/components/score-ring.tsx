import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number; // 0..100
  conforme: boolean;
  exhaustif?: boolean;
  size?: number;
  className?: string;
}

/** Jauge de score accessible : chiffre lisible (serif), arc indicatif en couleur. */
export function ScoreRing({
  score,
  conforme,
  exhaustif = true,
  size = 180,
  className,
}: ScoreRingProps) {
  const stroke = Math.round(size * 0.075);
  const r = (size - stroke) / 2 - 1;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;

  // Couleur : vert si conforme & exhaustif & score élevé, orange si partiel/moyen, rouge sinon.
  const couleur = !conforme
    ? "hsl(var(--danger))"
    : !exhaustif
      ? "hsl(var(--warning))"
      : pct >= 80
        ? "hsl(var(--success))"
        : "hsl(var(--warning))";

  const num = Math.round(size * 0.3);

  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      role="img"
      aria-label={`Score de conformité : ${score} sur 100`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Piste */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeOpacity={0.18}
          strokeWidth={stroke}
        />
        {/* Arc de score */}
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
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-semibold tabular-nums leading-none"
          style={{ fontSize: num, color: couleur }}
        >
          {score}
        </span>
        <span className="mt-1 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          sur 100
        </span>
      </div>
    </div>
  );
}
