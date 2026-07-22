import type { StatoArticolo } from "@/lib/articoli/types";

const STATO_CONFIG: Record<StatoArticolo, { label: string; className: string }> = {
  BOZZA: { label: "Bozza", className: "text-chrome" },
  IN_ATTESA_APPROVAZIONE: { label: "In revisione", className: "text-amber" },
  PUBBLICATO: { label: "Pubblicato", className: "text-success" },
  RIFIUTATO: { label: "Rifiutato", className: "text-ember" },
};

/**
 * Badge di stato articolo (mockup 21/22/25): verde=pubblicato,
 * amber=in revisione, ember=rifiutato (logica cromatica fissa di
 * DESIGN_SYSTEM.md), chrome neutro per bozza. Condiviso da Dashboard
 * Autore, I Miei Articoli, Le Mie Bozze.
 */
export function StatoBadge({ stato }: { stato: StatoArticolo }) {
  const { label, className } = STATO_CONFIG[stato];
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide ${className}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
