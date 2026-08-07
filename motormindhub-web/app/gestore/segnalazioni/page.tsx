"use client";

import { useState } from "react";
import Link from "next/link";
import { useReportsQueue } from "@/lib/amministrazioneUtenti/useReportsQueue";
import type { StatoSegnalazione } from "@/lib/amministrazioneUtenti/types";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { FlagIcon } from "@/components/report/icons";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

const TABS: { stato: StatoSegnalazione; label: string }[] = [
  { stato: "APERTA", label: "Aperte" },
  { stato: "IN_GESTIONE", label: "In gestione" },
  { stato: "ARCHIVIATA", label: "Archiviate" },
];

const STATO_LABEL: Record<StatoSegnalazione, string> = {
  APERTA: "Aperta",
  IN_GESTIONE: "In gestione",
  ARCHIVIATA: "Archiviata",
};

/** Coda Segnalazioni (mockup 44, RF4.5/RF4.6, UC_26) — solo GESTORE_UTENTI. */
export default function CodaSegnalazioniPage() {
  const queue = useReportsQueue();
  const [tab, setTab] = useState<StatoSegnalazione>("APERTA");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Gestore Utenti</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Coda Segnalazioni
        </h1>
      </div>

      {queue.status === "loading" ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : queue.status === "error" ? (
        <p className="text-sm text-ember">Non è stato possibile caricare la coda delle segnalazioni.</p>
      ) : (
        <>
          <div className="inline-flex w-fit gap-1 rounded-md border border-paper/10 bg-carbon p-1">
            {TABS.map(({ stato, label }) => {
              const count = queue.segnalazioni.filter((s) => s.stato === stato).length;
              const isActive = tab === stato;
              return (
                <button
                  key={stato}
                  type="button"
                  onClick={() => setTab(stato)}
                  className={`rounded px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide ${
                    isActive ? "bg-accent text-asphalt" : "text-chrome hover:text-paper"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {(() => {
            const filtrate = queue.segnalazioni.filter((s) => s.stato === tab);
            if (filtrate.length === 0) {
              return (
                <EmptyState
                  icon={<FlagIcon className="h-6 w-6" />}
                  title="Nessuna segnalazione"
                  description="Non ci sono segnalazioni in questa categoria al momento."
                />
              );
            }
            return (
              <div className="overflow-x-auto rounded-lg border border-paper/10 bg-carbon">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-paper/10 text-xs uppercase tracking-wide text-fog">
                      <th className="px-6 py-4 font-heading font-semibold">Utente segnalato</th>
                      <th className="px-6 py-4 font-heading font-semibold">Motivazione</th>
                      <th className="px-6 py-4 font-heading font-semibold">Ricevuta</th>
                      <th className="px-6 py-4 font-heading font-semibold">Stato</th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtrate.map((segnalazione) => (
                      <tr key={segnalazione.id} className="border-b border-paper/10 last:border-0">
                        <td className="px-6 py-4 text-paper">{segnalazione.segnalatoNome}</td>
                        <td className="px-6 py-4 text-chrome">{segnalazione.motivazione}</td>
                        <td className="px-6 py-4 text-chrome">{formatData(segnalazione.dataCreazione)}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-full border border-status-pending/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-status-pending">
                            {STATO_LABEL[segnalazione.stato]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <Link
                              href={`/gestore/segnalazioni/${segnalazione.id}`}
                              className="rounded-md border border-paper/20 px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide text-paper"
                            >
                              Esamina
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
