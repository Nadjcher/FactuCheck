// Sceau de conformité — la signature visuelle de FactuCheck.
// Un cachet officiel : double anneau, texte courbé lisible (arc haut + arc bas),
// séparateurs en losange, et une coche de validation franche au centre.
// Hérite du vert de validation (--seal) ; s'adapte au thème.
import * as React from "react";

export function Sceau({
  size = 128,
  className,
  haut = "CONTRÔLÉ",
  bas = "CONFORME",
  "aria-hidden": ariaHidden = true,
}: {
  size?: number;
  className?: string;
  haut?: string;
  bas?: string;
  "aria-hidden"?: boolean;
}) {
  const id = React.useId().replace(/:/g, "");
  const R = 37; // rayon du texte courbé

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : "Sceau de conformité"}
      style={{ color: "hsl(var(--seal))" }}
    >
      <defs>
        {/* Arc du haut : gauche → droite par-dessus (texte à l'endroit). */}
        <path id={`${id}-top`} fill="none" d={`M ${50 - R},50 A ${R},${R} 0 0 1 ${50 + R},50`} />
        {/* Arc du bas : gauche → droite par-dessous (texte à l'endroit). */}
        <path id={`${id}-bot`} fill="none" d={`M ${50 - R},50 A ${R},${R} 0 0 0 ${50 + R},50`} />
      </defs>

      {/* Anneaux du cachet */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.45" />
      <circle cx="50" cy="50" r="44.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="30.5" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.4" />

      {/* Texte circulaire (haut à l'endroit, bas à l'endroit) */}
      <g
        fill="currentColor"
        style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "8.2px", letterSpacing: "2.1px" }}
      >
        <text>
          <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
            {haut}
          </textPath>
        </text>
        <text>
          <textPath href={`#${id}-bot`} startOffset="50%" textAnchor="middle">
            {bas}
          </textPath>
        </text>
      </g>

      {/* Séparateurs en losange à 3 h et 9 h */}
      <g fill="currentColor">
        <rect x="8.4" y="48.4" width="3.2" height="3.2" transform="rotate(45 10 50)" />
        <rect x="88.4" y="48.4" width="3.2" height="3.2" transform="rotate(45 90 50)" />
      </g>

      {/* Coche de validation, centrée */}
      <path
        d="M37 51 L46 60.5 L65 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
