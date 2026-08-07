"use client";

import { CheckCircleIcon } from "@/components/auth/icons";

interface ExportSuccessModalProps {
  targetNome: string;
  targetEmail: string;
  onClose: () => void;
}

/**
 * Popup "Esportazione Inviata" (mockup 49, RF4.7, UC_27). Testo corretto
 * rispetto al mockup ("tramite link sicuro, valido 24 ore"): l'esportazione
 * viene inviata come allegato JSON diretto, non un link di download —
 * deviazione documentata da RNF9.3 in GestioneNotifiche (backend).
 */
export function ExportSuccessModal({ targetNome, targetEmail, onClose }: ExportSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircleIcon className="h-5 w-5" />
        </div>

        <h2 className="mt-4 font-heading text-lg font-bold uppercase tracking-wide text-paper">
          Esportazione Inviata
        </h2>
        <p className="mt-2 text-sm text-fog">
          Il file con i dati personali di <span className="font-bold text-paper">{targetNome}</span> è stato
          generato e inviato in allegato all&apos;indirizzo email verificato.
        </p>

        <div className="mt-4 rounded-md bg-surface-raised px-4 py-3">
          <p className="font-heading text-xs font-semibold uppercase tracking-wide text-fog">Destinatario</p>
          <p className="mt-1 text-sm text-paper">{targetEmail}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-accent px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
        >
          Torna alla scheda utente
        </button>
      </div>
    </div>
  );
}
