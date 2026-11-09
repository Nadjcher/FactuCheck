"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";

/**
 * Infobulle accessible : déclencheur au clavier (bouton) + role="tooltip".
 * Chaque terme technique peut être enveloppé pour expliquer le jargon.
 */
export function Infobulle({ texte }: { texte: string }) {
  const id = React.useId();
  return (
    <span className="relative inline-flex group align-middle">
      <button
        type="button"
        aria-describedby={id}
        className="inline-flex text-muted-foreground hover:text-foreground focus-visible:text-foreground"
        aria-label="Aide"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-md border border-border bg-card p-2 text-xs text-card-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {texte}
      </span>
    </span>
  );
}
