"use client";

import { CheckCircleIcon } from "@/components/auth/icons";

interface ReactivateAccountModalProps {
  targetNome: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Popup "Riattivare l'account?" (mockup 43, RF4.4, UC_24). */
export function ReactivateAccountModal({ targetNome, pending, onCancel, onConfirm }: ReactivateAccountModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircleIcon className="h-5 w-5" />
        </div>

        <h2 className="mt-4 font-heading text-lg font-bold uppercase tracking-wide text-paper">
          Riattivare l&apos;account di &quot;{targetNome}&quot;?
        </h2>
        <p className="mt-2 text-sm text-fog">
          Hai verificato che il profilo è stato corretto rispetto alla motivazione della sospensione.
          L&apos;utente riceverà una email di conferma.
        </p>

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
            disabled={pending}
            className="rounded-md bg-amber px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
          >
            {pending ? "Riattivazione…" : "Conferma riattivazione"}
          </button>
        </div>
      </div>
    </div>
  );
}
