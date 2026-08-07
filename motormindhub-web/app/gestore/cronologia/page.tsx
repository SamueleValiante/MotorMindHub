"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdministrativeActionLog } from "@/lib/amministrazioneUtenti/useAdministrativeActionLog";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { SearchIcon } from "@/components/public/icons";
import { ClockIcon } from "@/components/gestore/icons";
import type { TipoAzioneAmministrativa } from "@/lib/amministrazioneUtenti/types";

function formatDataOra(iso: string): string {
  const data = new Date(iso);
  return `${data.toLocaleDateString("it-IT")} · ${data.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
}

type Tab = "TUTTE" | TipoAzioneAmministrativa;

const TABS: { value: Tab; label: string }[] = [
  { value: "TUTTE", label: "Tutte" },
  { value: "SOSPENSIONE", label: "Sospensioni" },
  { value: "RIATTIVAZIONE", label: "Riattivazioni" },
  { value: "CANCELLAZIONE", label: "Cancellazioni" },
  { value: "ESPORTAZIONE", label: "Esportazioni" },
];

const TIPO_AZIONE_LABEL: Record<TipoAzioneAmministrativa, string> = {
  SOSPENSIONE: "Sospensione",
  RIATTIVAZIONE: "Riattivazione",
  CANCELLAZIONE: "Cancellazione",
  ESPORTAZIONE: "Esportazione",
};

/**
 * Cronologia Azioni Amministrative (mockup 48, RF4.8) — solo GESTORE_UTENTI.
 * Colonna "Operatore" del mockup omessa: nessun dato disponibile, scelta di
 * design deliberata e documentata nell'entità backend LogAzioneAmministrativa
 * (nessun campo "chi ha eseguito l'azione"), non un'omissione qui.
 */
export default function CronologiaPage() {
  const log = useAdministrativeActionLog();
  const [tab, setTab] = useState<Tab>("TUTTE");
  const [search, setSearch] = useState("");

  if (log.status === "loading") {
    return <p className="text-sm text-fog">Caricamento…</p>;
  }

  if (log.status === "error") {
    return <p className="text-sm text-ember">Non è stato possibile caricare la cronologia.</p>;
  }

  const perTab = log.azioni.filter((azione) => tab === "TUTTE" || azione.tipoAzione === tab);

  const query = search.trim().toLowerCase();
  const filtrate = perTab.filter(
    (azione) =>
      azione.utenteTargetNome.toLowerCase().includes(query) ||
      (azione.dettaglio ?? "").toLowerCase().includes(query)
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Gestore Utenti</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Cronologia Azioni Amministrative
        </h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm sm:w-full">
          <label htmlFor="cerca-cronologia" className="sr-only">
            Cerca nella cronologia
          </label>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
          <input
            id="cerca-cronologia"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cerca nella cronologia…"
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

      {filtrate.length === 0 ? (
        <EmptyState
          icon={<ClockIcon className="h-6 w-6" />}
          title="Nessuna azione trovata"
          description="Nessuna azione amministrativa corrisponde ai filtri selezionati."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-paper/10 bg-carbon">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-xs uppercase tracking-wide text-fog">
                <th className="px-6 py-4 font-heading font-semibold">Data</th>
                <th className="px-6 py-4 font-heading font-semibold">Azione</th>
                <th className="px-6 py-4 font-heading font-semibold">Utente coinvolto</th>
              </tr>
            </thead>
            <tbody>
              {filtrate.map((azione, index) => (
                <tr key={index} className="border-b border-paper/10 last:border-0">
                  <td className="px-6 py-4 whitespace-nowrap text-chrome">{formatDataOra(azione.dataAzione)}</td>
                  <td className="px-6 py-4 text-paper">
                    {TIPO_AZIONE_LABEL[azione.tipoAzione]}
                    {azione.dettaglio ? ` — ${azione.dettaglio}` : ""}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/gestore/gestione-account/${azione.utenteTargetId}`}
                      className="text-accent hover:underline"
                    >
                      {azione.utenteTargetNome}
                    </Link>
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
