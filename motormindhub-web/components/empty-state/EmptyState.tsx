import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateActionBase {
  label: string;
}

type EmptyStateAction =
  | (EmptyStateActionBase & { href: string; onClick?: never })
  | (EmptyStateActionBase & { onClick: () => void; href?: never });

interface EmptyStateProps {
  /** Glifo al centro del cerchio: qualunque icona adatta al contesto (bookmark, ricerca, bandiera, matita, ...). */
  icon: ReactNode;
  title: string;
  description: string;
  /** Opzionale: solo alcuni empty state hanno una call to action (cfr. mockup 51). */
  action?: EmptyStateAction;
}

const actionClassName =
  "inline-flex items-center rounded-md bg-amber px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt";

/**
 * Componente condiviso e riusabile (docs/mockups/51_component_empty_states.png):
 * nessun sottosistema ne ha una versione fissa, ognuno passa icona/testi/azione
 * propri (nessun articolo salvato, nessuna segnalazione in coda, nessuna
 * bozza, nessun risultato di ricerca, ...).
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg bg-carbon px-8 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-fog/40 text-fog">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-paper">
          {title}
        </h3>
        <p className="max-w-xs text-sm text-fog">{description}</p>
      </div>
      {action &&
        (action.href ? (
          <Link href={action.href} className={actionClassName}>
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={actionClassName}>
            {action.label}
          </button>
        ))}
    </div>
  );
}
