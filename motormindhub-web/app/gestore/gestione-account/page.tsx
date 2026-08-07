"use client";

import { useState } from "react";
import Link from "next/link";
import { useUsers } from "@/lib/amministrazioneUtenti/useUsers";
import { useDeletionRequestsQueue } from "@/lib/amministrazioneUtenti/useDeletionRequestsQueue";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { SearchIcon } from "@/components/public/icons";
import { PeopleIcon } from "@/components/manager/icons";
import type { StatoUtente } from "@/lib/amministrazioneUtenti/types";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

type Tab = "TUTTI" | "ATTIVI" | "SOSPESI" | "IN_CANCELLAZIONE";

const TABS: { value: Tab; label: string }[] = [
  { value: "TUTTI", label: "Tutti" },
  { value: "ATTIVI", label: "Attivi" },
  { value: "SOSPESI", label: "Sospesi" },
  { value: "IN_CANCELLAZIONE", label: "In cancellazione" },
];

const STATO_LABEL: Record<StatoUtente, string> = {
  NON_VERIFICATO: "Non verificato",
  ATTIVO: "Attivo",
  SOSPESO: "Sospeso",
  CANCELLATO: "Cancellato",
};

const STATO_CLASS: Record<StatoUtente, string> = {
  NON_VERIFICATO: "text-chrome",
  ATTIVO: "text-success",
  SOSPESO: "text-ember",
  CANCELLATO: "text-fog",
};

/** Gestione Account (mockup 39, RF4.2, UC_22) — solo GESTORE_UTENTI. */
export default function GestioneAccountPage() {
  const users = useUsers();
  const deletionQueue = useDeletionRequestsQueue();
  const [tab, setTab] = useState<Tab>("TUTTI");
  const [search, setSearch] = useState("");

  if (users.status === "loading" || deletionQueue.status === "loading") {
    return <p className="text-sm text-fog">Caricamento…</p>;
  }

  if (users.status === "error" || deletionQueue.status === "error") {
    return <p className="text-sm text-ember">Non è stato possibile caricare gli account.</p>;
  }

  // "In Cancellazione" (mockup 39) non è un valore nativo di StatoUtente
  // (ODD 2.1, dead code IN_CANCELLAZIONE rimosso): derivato incrociando la
  // lista utenti con la coda cancellazioni IN_CODA.
  const idsInCancellazione = new Set(
    deletionQueue.richieste.filter((r) => r.stato === "IN_CODA").map((r) => r.utenteId)
  );

  const perTab = users.utenti.filter((utente) => {
    if (tab === "ATTIVI") return utente.stato === "ATTIVO";
    if (tab === "SOSPESI") return utente.stato === "SOSPESO";
    if (tab === "IN_CANCELLAZIONE") return idsInCancellazione.has(utente.id);
    return true;
  });

  const query = search.trim().toLowerCase();
  const filtrati = perTab.filter(
    (utente) =>
      `${utente.nome} ${utente.cognome}`.toLowerCase().includes(query) ||
      utente.email.toLowerCase().includes(query)
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Gestore Utenti</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Gestione Account
        </h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm sm:w-full">
          <label htmlFor="cerca-utente" className="sr-only">
            Cerca utente
          </label>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
          <input
            id="cerca-utente"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cerca utente per nome o email…"
            className="w-full rounded-md bg-surface-raised py-3 pl-11 pr-4 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="inline-flex w-fit gap-1 rounded-md border border-paper/10 bg-carbon p-1">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`whitespace-nowrap rounded px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide ${
                tab === value ? "bg-accent text-asphalt" : "text-chrome hover:text-paper"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtrati.length === 0 ? (
        <EmptyState
          icon={<PeopleIcon className="h-6 w-6" />}
          title="Nessun utente"
          description="Nessun utente corrisponde ai filtri selezionati."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-paper/10 bg-carbon">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-xs uppercase tracking-wide text-fog">
                <th className="px-6 py-4 font-heading font-semibold">Utente</th>
                <th className="px-6 py-4 font-heading font-semibold">Stato</th>
                <th className="px-6 py-4 font-heading font-semibold">Iscritto dal</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {filtrati.map((utente) => (
                <tr key={utente.id} className="border-b border-paper/10 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div aria-hidden="true" className="h-9 w-9 shrink-0 rounded-full bg-surface-raised" />
                      <div className="min-w-0">
                        <p className="truncate text-paper">
                          {utente.nome} {utente.cognome}
                        </p>
                        <p className="truncate text-xs text-fog">{utente.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide ${STATO_CLASS[utente.stato]}`}
                    >
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                      {STATO_LABEL[utente.stato]}
                    </span>
                    {idsInCancellazione.has(utente.id) && (
                      <span className="ml-2 rounded-full border border-status-pending/40 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-status-pending">
                        In cancellazione
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-chrome">{formatData(utente.dataRegistrazione)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <Link
                        href={`/gestore/gestione-account/${utente.id}`}
                        className="rounded-md border border-paper/20 px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide text-paper"
                      >
                        Apri scheda
                      </Link>
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
