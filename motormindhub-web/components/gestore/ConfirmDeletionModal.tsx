"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/account/icons";

interface ConfirmDeletionModalProps {
  targetNome: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Popup "Procedere con la cancellazione?" (mockup 47, RF4.6, UC_25). La
 * checkbox è una conferma manuale lato UI, non una chiamata separata: la
 * validazione reale (nessun articolo in attesa di approvazione) è
 * server-side (ContenutiInSospesoException, gestita dal chiamante).
 *
 * Testo corretto rispetto al mockup ("entro 30 giorni"): l'anonimizzazione
 * (Utente.anonimizza()) è sincrona nel metodo transazionale, non differita.
 */
export function ConfirmDeletionModal({ targetNome, pending, onCancel, onConfirm }: ConfirmDeletionModalProps) {
  const [confermato, setConfermato] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ember/10 text-ember">
          <TrashIcon className="h-5 w-5" />
        </div>

        <h2 className="mt-4 font-heading text-lg font-bold uppercase tracking-wide text-paper">
          Procedere con la cancellazione?
        </h2>
        <p className="mt-2 text-sm text-fog">
          Hai verificato che l&apos;account di <span className="font-bold text-paper">{targetNome}</span> non ha
          contenuti editoriali in sospeso. I dati personali verranno eliminati o anonimizzati immediatamente e in
          modo irreversibile.
        </p>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-chrome">
          <input
            type="checkbox"
            checked={confermato}
            onChange={(event) => setConfermato(event.target.checked)}
            className="h-4 w-4 accent-amber"
          />
          Nessun contenuto in sospeso collegato all&apos;account
        </label>

        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="font-heading text-sm font-bold uppercase tracking-wide text-chrome disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || !confermato}
            className="rounded-md bg-ember px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-paper disabled:opacity-50"
          >
            {pending ? "Elaborazione…" : "Procedi con la cancellazione"}
          </button>
        </div>
      </div>
    </div>
  );
}
