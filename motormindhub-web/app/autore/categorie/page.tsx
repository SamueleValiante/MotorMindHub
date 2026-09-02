"use client";

import { useState } from "react";
import { useCategoryTree } from "@/lib/categorie/useCategoryTree";
import { getCategoryById, type CategoryDetail } from "@/lib/categorie/categoryMutations";
import { CategoryTree } from "@/components/categorie/CategoryTree";
import { CategoryFormModal } from "@/components/categorie/CategoryFormModal";

type ModalState = { mode: "create" } | { mode: "edit"; category: CategoryDetail } | null;

/**
 * Categorie (mockup 27, lato Autore): creazione e modifica (RF2.5/RF2.6),
 * nessuna eliminazione — RF3.5 è riservata al Manager Autori (vedi
 * /manager/categorie, mockup 34/35, stesso CategoryTree con canDelete).
 */
export default function AutoreCategoriePage() {
  const categorie = useCategoryTree();
  const [modal, setModal] = useState<ModalState>(null);

  const handleEdit = async (categoryId: number) => {
    const detail = await getCategoryById(categoryId);
    if (detail) setModal({ mode: "edit", category: detail });
  };

  const handleSaved = () => {
    setModal(null);
    categorie.refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-xs uppercase tracking-wide text-fog">Area Autore</p>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
            Categorie
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="shrink-0 rounded-md bg-accent px-5 py-3 text-center font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
        >
          + Nuova categoria
        </button>
      </div>

      {categorie.status === "loading" ? (
        <p className="text-sm text-fog">Caricamento…</p>
      ) : categorie.status === "error" ? (
        <p className="text-sm text-ember">Non è stato possibile caricare le categorie.</p>
      ) : (
        <CategoryTree tree={categorie.tree} canDelete={false} onEdit={(id) => void handleEdit(id)} />
      )}

      {modal && (
        <CategoryFormModal
          tree={categorie.status === "ready" ? categorie.tree : []}
          category={modal.mode === "edit" ? modal.category : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
