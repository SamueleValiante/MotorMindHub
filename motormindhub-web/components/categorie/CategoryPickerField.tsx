"use client";

import { useState } from "react";
import { useFocusTrap } from "@/lib/shared/useFocusTrap";
import { useCategoryDrilldown } from "@/lib/categorie/useCategoryDrilldown";
import { findCategoryPath } from "@/lib/categorie/categoryDrilldown";
import { ChevronDownIcon, CloseIcon } from "@/components/public/icons";
import type { CategoryTreeNode } from "@/lib/categorie/types";

const triggerClassName =
  "flex w-full items-center justify-between gap-3 rounded-md bg-surface-raised px-4 py-3 text-left text-sm text-chrome outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50";

interface CategoryPickerFieldProps {
  id?: string;
  tree: CategoryTreeNode[];
  value: number | null;
  onChange: (id: number | null) => void;
  /** Nodi (e sottoalberi) da escludere dalla scelta — es. la categoria stessa in ReassignCategoryModal. */
  excludeIds?: number[];
  /** Mostra un'opzione esplicita "Nessuna categoria" (radice), per il campo "Categoria padre" di CategoryFormModal. */
  allowNone?: boolean;
  /**
   * Filtro opzionale su quali nodi sono confermabili come valore finale (default: tutti). Nessun
   * chiamante lo usa oggi — nessun vincolo "solo foglie" esiste lato dominio (vedi commento sotto)
   * — ma un futuro `isSelectable={(n) => n.figlie.length === 0}` nell'editor articolo, se si
   * decidesse di vietare nodi organizzativi come categoria finale, si innesta qui senza toccare
   * il resto del componente.
   */
  isSelectable?: (node: CategoryTreeNode) => boolean;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Sostituisce, nei tre punti di form che assegnano un valore categoria
 * (editor articolo, "Categoria padre" in CategoryFormModal, destinazione in
 * ReassignCategoryModal), il <select> piatto con flattenCategoryTree: a 84
 * nodi/5 livelli la lista piatta perde la gerarchia (l'indentazione a spazi
 * di flattenCategoryTree viene comunque collassata dal rendering nativo
 * delle <option>, quindi in pratica non era nemmeno visibile) — stesso
 * problema già risolto per Esplora Articoli con CategoryDrilldownNav, qui
 * risolto con un componente diverso perché il caso d'uso è diverso: un
 * valore di form da confermare una volta, non un filtro che naviga
 * risultati in tempo reale (CategoryDrilldownNav non ha concetto di
 * conferma/chiusura).
 *
 * Interazione: click su un nodo foglia (nessuna figlia) sceglie e chiude
 * subito; click su un nodo con figlie scende di un livello. Il bottone
 * "Usa questa categoria" (visibile per qualunque nodo non-radice) conferma
 * anche un nodo con figlie — nessun vincolo "solo foglie" esiste oggi né
 * lato backend (GestioneArticoli.risolviCategoria accetta qualunque id
 * esistente) né qui, quindi un nodo puramente organizzativo resta comunque
 * selezionabile.
 */
export function CategoryPickerField({
  id,
  tree,
  value,
  onChange,
  excludeIds = [],
  allowNone = false,
  isSelectable = () => true,
  placeholder = "Seleziona una categoria…",
  disabled = false,
}: CategoryPickerFieldProps) {
  const [open, setOpen] = useState(false);

  const selectedNome = findCategoryPath(tree, value).at(-1)?.nome ?? null;

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={triggerClassName}
      >
        <span className={selectedNome ? "text-chrome" : "text-fog"}>{selectedNome ?? placeholder}</span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-fog" />
      </button>

      {open && (
        <CategoryPickerModal
          tree={tree}
          value={value}
          excludeIds={excludeIds}
          allowNone={allowNone}
          isSelectable={isSelectable}
          onChoose={(next) => {
            onChange(next);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

interface CategoryPickerModalProps {
  tree: CategoryTreeNode[];
  value: number | null;
  excludeIds: number[];
  allowNone: boolean;
  isSelectable: (node: CategoryTreeNode) => boolean;
  onChoose: (id: number | null) => void;
  onClose: () => void;
}

function CategoryPickerModal({
  tree,
  value,
  excludeIds,
  allowNone,
  isSelectable,
  onChoose,
  onClose,
}: CategoryPickerModalProps) {
  const { path, currentNode, visibleNodes, navigate } = useCategoryDrilldown({
    tree,
    excludeIds,
    initialId: value,
  });
  const containerRef = useFocusTrap<HTMLDivElement>({ isOpen: true, onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/80 p-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-picker-title"
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl bg-carbon p-8 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="category-picker-title"
            tabIndex={-1}
            data-focus-trap-initial
            className="font-heading text-lg font-bold uppercase tracking-wide text-paper outline-none"
          >
            Seleziona categoria
          </h2>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="text-fog hover:text-paper">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {allowNone && (
          <button
            type="button"
            onClick={() => onChoose(null)}
            className="self-start rounded-md border border-dashed border-chrome/40 px-3 py-1.5 text-left text-xs uppercase tracking-wide text-fog hover:border-accent hover:text-accent"
          >
            Nessuna — categoria radice
          </button>
        )}

        <nav aria-label="Percorso categoria" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <button
            type="button"
            onClick={() => navigate(null)}
            aria-current={currentNode === null ? "location" : undefined}
            className={`rounded-md px-2 py-1 font-heading font-bold uppercase tracking-wide ${
              currentNode === null ? "bg-accent text-asphalt" : "text-chrome hover:text-accent"
            }`}
          >
            Tutte le categorie
          </button>
          {path.map((categoria, index) => {
            const isLast = index === path.length - 1;
            return (
              <span key={categoria.id} className="flex items-center gap-x-2">
                <span aria-hidden="true" className="text-fog">
                  /
                </span>
                <button
                  type="button"
                  onClick={() => navigate(categoria.id)}
                  aria-current={isLast ? "location" : undefined}
                  className={`rounded-md px-2 py-1 font-heading font-bold uppercase tracking-wide ${
                    isLast ? "bg-accent text-asphalt" : "text-chrome hover:text-accent"
                  }`}
                >
                  {categoria.nome}
                </button>
              </span>
            );
          })}
        </nav>

        {currentNode && isSelectable(currentNode) && (
          <button
            type="button"
            onClick={() => onChoose(currentNode.id)}
            className="self-start rounded-md bg-accent px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide text-asphalt"
          >
            Usa &quot;{currentNode.nome}&quot;
          </button>
        )}

        {visibleNodes.length > 0 ? (
          <div className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto" role="group" aria-label="Sottocategorie">
            {visibleNodes.map((node) => {
              const isLeaf = node.figlie.length === 0;
              const selectable = isSelectable(node);
              return (
                <button
                  key={node.id}
                  type="button"
                  disabled={isLeaf && !selectable}
                  onClick={() => (isLeaf ? onChoose(node.id) : navigate(node.id))}
                  className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-chrome hover:bg-surface-raised hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-chrome"
                >
                  {node.nome}
                  {!isLeaf && <ChevronDownIcon className="h-4 w-4 shrink-0 -rotate-90 text-fog" />}
                </button>
              );
            })}
          </div>
        ) : (
          currentNode && <p className="text-xs text-fog">Nessuna sotto-categoria.</p>
        )}
      </div>
    </div>
  );
}
