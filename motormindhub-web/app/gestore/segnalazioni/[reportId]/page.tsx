"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useReportsQueue } from "@/lib/amministrazioneUtenti/useReportsQueue";
import { resolveReport, escalateReportToSuspension } from "@/lib/amministrazioneUtenti/reportMutations";
import { SuspendAccountModal } from "@/components/gestore/SuspendAccountModal";
import { toast } from "@/lib/toast/toast";
import type { SuspensionInput } from "@/lib/amministrazioneUtenti/types";

/** Sostituisce il messaggio generico di successo quando solo la seconda chiamata dell'orchestrazione fallisce. */
const RESOLVE_FAILED_MESSAGE =
  "Utente sospeso correttamente, ma la segnalazione non è stata chiusa — chiudila manualmente dalla coda.";

/** Dettaglio Segnalazione (mockup 45, RF4.5, UC_26) — solo GESTORE_UTENTI. */
export default function DettaglioSegnalazionePage() {
  const params = useParams<{ reportId: string }>();
  const router = useRouter();
  const parsedId = /^\d+$/.test(params.reportId) ? Number(params.reportId) : null;

  const queue = useReportsQueue();
  const [pending, setPending] = useState<"modifica" | "sospensione" | "archivia" | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);

  if (queue.status === "loading") {
    return <p className="text-sm text-fog">Caricamento…</p>;
  }

  if (queue.status === "error" || parsedId === null) {
    return <p className="text-sm text-ember">Non è stato possibile caricare la segnalazione.</p>;
  }

  const segnalazione = queue.segnalazioni.find((s) => s.id === parsedId);

  if (!segnalazione) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper">
          Segnalazione non trovata
        </h1>
        <Link href="/gestore/segnalazioni" className="font-heading text-sm font-bold uppercase text-amber">
          ← Torna alla coda segnalazioni
        </Link>
      </div>
    );
  }

  const nonLavorabile = segnalazione.stato === "ARCHIVIATA";

  const handleRichiediModifica = async () => {
    setPending("modifica");
    const ok = await resolveReport(segnalazione.id, "IN_GESTIONE");
    setPending(null);
    if (ok) router.push("/gestore/segnalazioni");
  };

  const handleArchivia = async () => {
    setPending("archivia");
    const ok = await resolveReport(segnalazione.id, "ARCHIVIATA");
    setPending(null);
    if (ok) router.push("/gestore/segnalazioni");
  };

  const handleConfirmSospensione = async (dto: SuspensionInput) => {
    setPending("sospensione");
    const result = await escalateReportToSuspension(segnalazione.id, segnalazione.segnalatoId, dto);
    setPending(null);

    if (result.outcome === "suspend-failed") {
      // La sospensione non è avvenuta: il popup resta aperto, l'utente può correggere e ritentare.
      toast.error(result.message);
      return;
    }

    // Da qui in poi l'account è sospeso comunque, quindi il popup si chiude: ritentarlo
    // richiamerebbe suspendAccount su un account già sospeso, fallendo di nuovo.
    setSuspendModalOpen(false);

    if (result.outcome === "resolve-failed") {
      // Esplicito e distinto dal successo pieno: non deve sembrare che sia andato tutto bene.
      toast.error(RESOLVE_FAILED_MESSAGE, 10000);
    } else {
      toast.success("Account sospeso e segnalazione archiviata.");
    }

    router.push("/gestore/segnalazioni");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Gestore Utenti</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Dettaglio Segnalazione
        </h1>
      </div>

      <div className="rounded-lg border border-paper/10 bg-carbon p-6">
        <p className="font-heading text-xs font-semibold uppercase tracking-wide text-fog">Utente segnalato</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-surface-raised" />
          <p className="font-heading text-base font-bold text-paper">{segnalazione.segnalatoNome}</p>
        </div>

        <p className="mt-6 font-heading text-xs font-semibold uppercase tracking-wide text-fog">Segnalato da</p>
        <p className="mt-2 text-sm text-chrome">Utente anonimo (identità protetta)</p>

        <p className="mt-6 font-heading text-xs font-semibold uppercase tracking-wide text-fog">Motivazione</p>
        <p className="mt-2 whitespace-pre-wrap rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome">
          {segnalazione.motivazione}
        </p>

        <p className="mt-6 font-heading text-xs font-semibold uppercase tracking-wide text-fog">Screenshot allegato</p>
        <p className="mt-2 text-sm text-fog">Nessun allegato disponibile.</p>
      </div>

      <div className="rounded-lg border border-paper/10 bg-carbon p-6">
        <p className="font-heading text-xs font-semibold uppercase tracking-wide text-fog">Azioni</p>

        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void handleRichiediModifica()}
            disabled={pending !== null || nonLavorabile}
            className="rounded-md bg-amber px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
          >
            {pending === "modifica" ? "Invio richiesta…" : "Richiedi modifica (7 gg)"}
          </button>
          <button
            type="button"
            onClick={() => setSuspendModalOpen(true)}
            disabled={pending !== null || nonLavorabile}
            className="rounded-md bg-ember px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
          >
            Scala a sospensione
          </button>
          <button
            type="button"
            onClick={() => void handleArchivia()}
            disabled={pending !== null || nonLavorabile}
            className="rounded-md border border-paper/20 px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-50"
          >
            {pending === "archivia" ? "Archiviazione…" : "Archivia come infondata"}
          </button>
        </div>
      </div>

      {suspendModalOpen && (
        <SuspendAccountModal
          targetNome={segnalazione.segnalatoNome}
          pending={pending === "sospensione"}
          onCancel={() => setSuspendModalOpen(false)}
          onConfirm={(dto) => void handleConfirmSospensione(dto)}
        />
      )}
    </div>
  );
}
