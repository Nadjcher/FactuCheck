// Sceau de conformité — la signature visuelle de FactuCheck.
// Un cachet officiel « CONTRÔLÉ · CONFORME » avec une coche centrale.
// Hérite de la couleur via currentColor (par défaut le vert de validation --seal).
import * as React from "react";

export function Sceau({
  size = 128,
  className,
  texte = "CONTRÔLÉ · CONFORME · EN 16931 · ",
  "aria-hidden": ariaHidden = true,
}: {
  size?: number;
  className?: string;
  texte?: string;
  "aria-hidden"?: boolean;
}) {
  const id = React.useId().replace(/:/g, "");
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
        {/* Cercle support du texte courbe (rayon 39), démarré en haut. */}
        <path id={`${id}-circle`} fill="none" d="M50,11 a39,39 0 1,1 -0.01,0" />
      </defs>

      {/* Double anneau du cachet */}
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <circle cx="50" cy="50" r="43.5" fill="none" stroke="currentColor" strokeWidth="2.5" />

      {/* Texte circulaire */}
      <text fill="currentColor" style={{ fontFamily: "var(--font-sans)", fontSize: "7.3px", fontWeight: 600, letterSpacing: "1.6px" }}>
        <textPath href={`#${id}-circle`} startOffset="0">
          {texte.repeat(2).slice(0, Math.max(texte.length, 34))}
        </textPath>
      </text>

      {/* Deux étoiles de séparation en bas */}
      <g fill="currentColor" opacity="0.9" />

      {/* Coche centrale, tracée comme un geste de validation */}
      <path
        d="M34 51.5 L45 62 L68 38"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
