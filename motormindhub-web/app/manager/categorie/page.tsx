"use client";

import { useState } from "react";
import { useCategoryTree } from "@/lib/categorie/useCategoryTree";
import { getCategoryById, type CategoryDetail, type FlatCategoryRow } from "@/lib/categorie/categoryMutations";
import { CategoryTable } from "@/components/categorie/CategoryTable";
import { CategoryFormModal } from "@/components/categorie/CategoryFormModal";
import { ReassignCategoryModal } from "@/components/categorie/ReassignCategoryModal";

type ModalState = { mode: "create" } | { mode: "edit"; category: CategoryDetail } | null;

/**
 * Gestione Categorie (mockup 34, lato Manager): stesso CategoryTable/
 * CategoryFormModal dell'area Autore (creazione/modifica ammesse anche per
 * MANAGER_AUTORI lato backend, vedi CategorieController), più eliminazione
 * con riassegnazione (RF3.5, mockup 35) riservata a questo ruolo.
 */
export default function ManagerCategoriePage() {
  const categorie = useCategoryTree();
  const [modal, setModal] = useState<ModalState>(null);
  const [pendingDelete, setPendingDelete] = useState<FlatCategoryRow | null>(null);

  const handleEdit = async (categoryId: number) => {
    const detail = await getCategoryById(categoryId);
    if (detail) setModal({ mode: "edit", category: detail });
  };

  const handleSaved = () => {
    setModal(null);
    categorie.refetch();
  };

  const handleDeleted = () => {
    setPendingDelete(null);
    categorie.refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-xs uppercase tracking-wide text-fog">Manager Autori</p>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
            Gestione Categorie
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
        <CategoryTable
          tree={categorie.tree}
          canDelete
          onEdit={(id) => void handleEdit(id)}
          onDelete={(row) => setPendingDelete(row)}
        />
      )}

      {modal && (
        <CategoryFormModal
          tree={categorie.status === "ready" ? categorie.tree : []}
          category={modal.mode === "edit" ? modal.category : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {pendingDelete && categorie.status === "ready" && (
        <ReassignCategoryModal
          tree={categorie.tree}
          categoryId={pendingDelete.id}
          categoryNome={pendingDelete.nome}
          onCancel={() => setPendingDelete(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
