import { TrashIcon } from "@/components/account/icons";
import { useFocusTrap } from "@/lib/shared/useFocusTrap";

interface ConfirmDeleteModalProps {
  titolo: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}

/**
 * Popup di conferma eliminazione (mockup 26), condiviso da I Miei
 * Articoli e Le Mie Bozze — stesso testo generico "Eliminare questo
 * articolo?" con il titolo interpolato, valido per entrambi i contesti.
 */
export function ConfirmDeleteModal({ titolo, onConfirm, onCancel, pending }: ConfirmDeleteModalProps) {
  const containerRef = useFocusTrap<HTMLDivElement>({ isOpen: true, onClose: onCancel });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="elimina-articolo-title"
        className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ember/10 text-ember">
          <TrashIcon className="h-5 w-5" />
        </div>

        <h2
          id="elimina-articolo-title"
          tabIndex={-1}
          data-focus-trap-initial
          className="mt-4 font-heading text-lg font-bold uppercase tracking-wide text-paper outline-none"
        >
          Eliminare questo articolo?
        </h2>
        <p className="mt-2 text-sm text-fog">
          L&apos;azione è irreversibile. &quot;{titolo}&quot; verrà rimosso definitivamente dal
          server e non sarà più recuperabile.
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
            className="rounded-md bg-ember px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
          >
            {pending ? "Rimozione…" : "Sì, rimuovi"}
          </button>
        </div>
      </div>
    </div>
  );
}
