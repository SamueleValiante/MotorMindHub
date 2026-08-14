"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/account/icons";
import { PeopleIcon } from "@/components/manager/icons";
import { SearchIcon } from "@/components/public/icons";
import { EmptyState } from "@/components/empty-state/EmptyState";
import type { AuthorSummary } from "@/lib/autori/types";

interface AuthorTableProps {
  autori: AuthorSummary[];
  onRemove: (autore: AuthorSummary) => void;
}

/**
 * Formatta percentualeApprovazione (frazione 0..1, null se l'autore non ha mai sottomesso un
 * articolo — cfr. lib/autori/types.ts) come intero percentuale. "N/D" invece di "0%" per il caso
 * null: 0% sarebbe fuorviante ("tutti rifiutati") per chi semplicemente non ha ancora sottomesso.
 */
function formatPercentualeApprovazione(percentuale: number | null): string {
  return percentuale === null ? "N/D" : `${Math.round(percentuale * 100)}%`;
}

/** Badge stato (mockup 30): binario Attivo/Inattivo, non i 4 valori reali di StatoUtente — il Manager non ha comunque azioni su SOSPESO/CANCELLATO/NON_VERIFICATO da questa pagina. */
function StatoAutoreBadge({ stato }: { stato: AuthorSummary["stato"] }) {
  const attivo = stato === "ATTIVO";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide ${
        attivo ? "text-success" : "text-chrome"
      }`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {attivo ? "Attivo" : "Inattivo"}
    </span>
  );
}

/** Tabella Gestione Autori (mockup 30): ricerca + lista, icona rimuovi diretta invece del menu "···" del mockup (unica azione disponibile). */
export function AuthorTable({ autori, onRemove }: AuthorTableProps) {
  const [search, setSearch] = useState("");

  const filtrati = autori.filter((autore) => {
    const query = search.trim().toLowerCase();
    return (
      `${autore.nome} ${autore.cognome}`.toLowerCase().includes(query) ||
      autore.email.toLowerCase().includes(query)
    );
  });

  if (autori.length === 0) {
    return (
      <EmptyState
        icon={<PeopleIcon className="h-6 w-6" />}
        title="Nessun autore ancora"
        description="Gli autori che inviti e che accettano l'invito compariranno qui."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <label htmlFor="cerca-autore" className="sr-only">
          Cerca autore
        </label>
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
        <input
          id="cerca-autore"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca autore…"
          className="w-full rounded-md bg-surface-raised py-3 pl-11 pr-4 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {filtrati.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="Nessun risultato"
          description="Nessun autore corrisponde alla ricerca."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-paper/10 bg-carbon">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-xs uppercase tracking-wide text-fog">
                <th className="px-6 py-4 font-heading font-semibold">Autore</th>
                <th className="px-6 py-4 font-heading font-semibold">Articoli</th>
                <th className="px-6 py-4 font-heading font-semibold">% Approvazione</th>
                <th className="px-6 py-4 font-heading font-semibold">Stato</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {filtrati.map((autore) => (
                <tr key={autore.id} className="border-b border-paper/10 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div aria-hidden="true" className="h-9 w-9 shrink-0 rounded-full bg-surface-raised" />
                      <div className="min-w-0">
                        <p className="truncate text-paper">
                          {autore.nome} {autore.cognome}
                        </p>
                        <p className="truncate text-xs text-fog">{autore.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-chrome">{autore.numeroArticoli}</td>
                  <td className="px-6 py-4 font-mono text-chrome">
                    {formatPercentualeApprovazione(autore.percentualeApprovazione)}
                  </td>
                  <td className="px-6 py-4">
                    <StatoAutoreBadge stato={autore.stato} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onRemove(autore)}
                        aria-label={`Rimuovi ${autore.nome} ${autore.cognome}`}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-asphalt/80 text-chrome hover:text-ember"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
