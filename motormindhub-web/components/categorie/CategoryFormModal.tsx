"use client";

import { useState, type FormEvent } from "react";
import { createCategory, updateCategory } from "@/lib/categorie/categoryMutations";
import type { CategoryDetail } from "@/lib/categorie/categoryMutations";
import { CategoryPickerField } from "@/components/categorie/CategoryPickerField";
import { useFocusTrap } from "@/lib/shared/useFocusTrap";
import { toast } from "@/lib/toast/toast";
import { CloseIcon } from "@/components/public/icons";
import type { CategoryTreeNode } from "@/lib/categorie/types";

const inputClassName =
  "rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50";
const labelClassName = "font-heading text-xs font-semibold uppercase tracking-wide text-fog";

interface CategoryFormModalProps {
  tree: CategoryTreeNode[];
  /** Presente = modalità modifica (mockup 28, UC_14); assente = nuova categoria (UC_12). */
  category?: CategoryDetail | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Modale condiviso Nuova/Modifica Categoria (mockup 28). In modifica, Nome e
 * Categoria padre sono disabled: GestioneCategorie.updateCategory (backend)
 * applica solo dto.descrizione, nome/categoriaPadreId inviati verrebbero
 * accettati ma silenziosamente ignorati — mostrarli editabili sarebbe
 * fuorviante.
 */
export function CategoryFormModal({ tree, category, onClose, onSaved }: CategoryFormModalProps) {
  const isEdit = !!category;
  const [nome, setNome] = useState(category?.nome ?? "");
  const [categoriaPadreId, setCategoriaPadreId] = useState<number | null>(category?.categoriaPadreId ?? null);
  const [descrizione, setDescrizione] = useState(category?.descrizione ?? "");
  const [pending, setPending] = useState(false);
  const containerRef = useFocusTrap<HTMLDivElement>({ isOpen: true, onClose });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nome.trim()) {
      toast.error("Il nome della categoria è obbligatorio.");
      return;
    }

    setPending(true);
    const dto = { nome: nome.trim(), categoriaPadreId, descrizione: descrizione.trim() || null };
    const ok = isEdit ? await updateCategory(category.id, dto) : await createCategory(dto);
    setPending(false);

    if (ok) onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="w-full max-w-md rounded-xl bg-carbon p-8 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="category-form-title"
            tabIndex={-1}
            data-focus-trap-initial
            className="font-heading text-lg font-bold uppercase tracking-wide text-paper outline-none"
          >
            {isEdit ? "Modifica categoria" : "Nuova categoria"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="text-fog hover:text-paper"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="categoria-nome" className={labelClassName}>
              Nome categoria
            </label>
            <input
              id="categoria-nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              disabled={isEdit}
              maxLength={150}
              className={inputClassName}
            />
            {isEdit && <p className="text-xs text-fog">Il nome non è modificabile da qui.</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="categoria-padre" className={labelClassName}>
              Categoria padre
            </label>
            <CategoryPickerField
              id="categoria-padre"
              tree={tree}
              value={categoriaPadreId}
              onChange={setCategoriaPadreId}
              excludeIds={category ? [category.id] : []}
              allowNone
              disabled={isEdit}
            />
            {isEdit && <p className="text-xs text-fog">La categoria padre non è modificabile da qui.</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="categoria-descrizione" className={labelClassName}>
              Descrizione
            </label>
            <textarea
              id="categoria-descrizione"
              value={descrizione}
              onChange={(event) => setDescrizione(event.target.value)}
              rows={4}
              maxLength={2000}
              className={`${inputClassName} resize-y leading-relaxed`}
            />
          </div>

          <div className="mt-2 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="font-heading text-sm font-bold uppercase tracking-wide text-chrome disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-accent px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt disabled:opacity-50"
            >
              {pending ? "Salvataggio…" : isEdit ? "Aggiorna categoria" : "Salva categoria"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
