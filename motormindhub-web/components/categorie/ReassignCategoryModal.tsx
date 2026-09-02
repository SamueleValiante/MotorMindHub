"use client";

import { useState } from "react";
import { deleteCategory } from "@/lib/categorie/categoryMutations";
import { countCategories } from "@/lib/categorie/useCategoryTree";
import { CategoryPickerField } from "@/components/categorie/CategoryPickerField";
import { TrashIcon } from "@/components/account/icons";
import type { CategoryTreeNode } from "@/lib/categorie/types";

interface ReassignCategoryModalProps {
  tree: CategoryTreeNode[];
  categoryId: number;
  categoryNome: string;
  onCancel: () => void;
  onDeleted: () => void;
}

/**
 * Popup Elimina + Riassegnazione (mockup 35, RF3.5, UC_13) — solo lato
 * Manager. Il conteggio "N articoli orfani" del mockup non è mostrato:
 * CategoryTreeNodeDTO (getCategoryTree) non porta un numero di articoli per
 * categoria, il backend non espone questo dato oggi.
 *
 * Se la categoria ha sottocategorie, deleteCategory risponde 409
 * ("Impossibile eliminare una categoria che contiene sottocategorie"):
 * CategoryTable disabilita già il cestino in quel caso (hasFigli), ma
 * questo modale resta pronto a mostrare l'errore del backend via toast se
 * qualcosa sfugge alla prevenzione lato UI (il backend resta comunque
 * l'autorità finale) — non esiste modo di spostare una sottocategoria
 * sotto un altro padre (updateCategory applica solo descrizione), quindi
 * il messaggio del backend resta l'unica spiegazione utile in quel caso.
 */
export function ReassignCategoryModal({
  tree,
  categoryId,
  categoryNome,
  onCancel,
  onDeleted,
}: ReassignCategoryModalProps) {
  const hasAlternative = countCategories(tree) > 1;
  const [destinazioneId, setDestinazioneId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    if (destinazioneId === null) return;
    setPending(true);
    const ok = await deleteCategory(categoryId, destinazioneId);
    setPending(false);
    if (ok) onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ember/10 text-ember">
          <TrashIcon className="h-5 w-5" />
        </div>

        <h2 className="mt-4 font-heading text-lg font-bold uppercase tracking-wide text-paper">
          Elimina &quot;{categoryNome}&quot;
        </h2>
        <p className="mt-2 text-sm text-fog">
          Gli articoli assegnati a questa categoria verranno spostati sulla categoria di
          destinazione scelta qui sotto.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="riassegna-categoria" className="font-heading text-xs font-semibold uppercase tracking-wide text-fog">
            Riassegna articoli a
          </label>
          <CategoryPickerField
            id="riassegna-categoria"
            tree={tree}
            value={destinazioneId}
            onChange={setDestinazioneId}
            excludeIds={[categoryId]}
            disabled={!hasAlternative}
            placeholder={hasAlternative ? "Seleziona una categoria…" : "Nessuna categoria alternativa disponibile"}
          />
        </div>

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
            onClick={() => void handleConfirm()}
            disabled={pending || destinazioneId === null}
            className="rounded-md bg-ember px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
          >
            {pending ? "Eliminazione…" : "Elimina definitivamente"}
          </button>
        </div>
      </div>
    </div>
  );
}
