import Link from "next/link";
import type { ReactNode } from "react";

interface ResultPanelProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: { label: string; href: string };
}

/**
 * Icona in cerchio + titolo + descrizione, condiviso dagli esiti delle
 * pagine di autenticazione (registrazione: "controlla la tua email",
 * conferma-email: successo/errore). A differenza di EmptyState non ha
 * un proprio sfondo/bordo: vive già dentro la card di app/(auth)/layout.tsx,
 * un secondo riquadro annidato sarebbe ridondante.
 */
export function ResultPanel({ icon, title, description, action }: ResultPanelProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber/10 text-amber">
        {icon}
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper">
          {title}
        </h1>
        <div className="text-sm text-fog">{description}</div>
      </div>
      {action && (
        <Link
          href={action.href}
          className="rounded-md bg-amber px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
