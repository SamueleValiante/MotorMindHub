"use client";

import { useState } from "react";
import { useDeletionRequestsQueue } from "@/lib/amministrazioneUtenti/useDeletionRequestsQueue";
import { processAccountDeletion } from "@/lib/amministrazioneUtenti/deletionMutations";
import { ConfirmDeletionModal } from "@/components/gestore/ConfirmDeletionModal";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { TrashIcon } from "@/components/account/icons";
import type { DeletionRequestQueueItem, StatoRichiestaCancellazione } from "@/lib/amministrazioneUtenti/types";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

const STATO_LABEL: Record<StatoRichiestaCancellazione, string> = {
  IN_CODA: "In coda",
  COMPLETATA: "Completata",
  RESPINTA: "Respinta",
};

/** Richieste di Cancellazione (mockup 46, RF4.6, UC_25) — solo GESTORE_UTENTI. */
export default function RichiesteCancellazionePage() {
  const queue = useDeletionRequestsQueue();
  const [pendingTarget, setPendingTarget] = useState<DeletionRequestQueueItem | null>(null);
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    if (!pendingTarget) return;
    setPending(true);
    const ok = await processAccountDeletion(pendingTarget.id);
    setPending(false);
    if (ok) {
      setPendingTarget(null);
      queue.refetch();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Gestore Utenti</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Richieste di Cancellazione
        </h1>
      </div>

      {queue.status === "loading" ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : queue.status === "error" ? (
        <p className="text-sm text-ember">Non è stato possibile caricare le richieste di cancellazione.</p>
      ) : queue.richieste.length === 0 ? (
        <EmptyState
          icon={<TrashIcon className="h-6 w-6" />}
          title="Nessuna richiesta di cancellazione"
          description="Le richieste di cancellazione account inviate dagli utenti compariranno qui."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-paper/10 bg-carbon">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-xs uppercase tracking-wide text-fog">
                <th className="px-6 py-4 font-heading font-semibold">Utente</th>
                <th className="px-6 py-4 font-heading font-semibold">Richiesta il</th>
                <th className="px-6 py-4 font-heading font-semibold">Stato</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {queue.richieste.map((richiesta) => (
                <tr key={richiesta.id} className="border-b border-paper/10 last:border-0">
                  <td className="px-6 py-4">
                    <p className="text-paper">{richiesta.utenteNome}</p>
                    <p className="text-xs text-fog">{richiesta.utenteEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-chrome">{formatData(richiesta.dataRichiesta)}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border border-amber/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber">
                      {STATO_LABEL[richiesta.stato]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      {richiesta.stato === "IN_CODA" && (
                        <button
                          type="button"
                          onClick={() => setPendingTarget(richiesta)}
                          className="rounded-md border border-paper/20 px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide text-paper"
                        >
                          Verifica
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingTarget && (
        <ConfirmDeletionModal
          targetNome={pendingTarget.utenteNome}
          pending={pending}
          onCancel={() => setPendingTarget(null)}
          onConfirm={() => void handleConfirm()}
        />
      )}
    </div>
  );
}
