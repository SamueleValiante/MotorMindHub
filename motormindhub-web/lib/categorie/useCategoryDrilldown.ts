import { useState } from "react";
import { findCategoryPath } from "./categoryDrilldown";
import type { CategoryTreeNode } from "./types";

function pruneExcluded(tree: CategoryTreeNode[], excludeIds: number[]): CategoryTreeNode[] {
  if (excludeIds.length === 0) return tree;
  return tree
    .filter((node) => !excludeIds.includes(node.id))
    .map((node) => ({ ...node, figlie: pruneExcluded(node.figlie, excludeIds) }));
}

interface UseCategoryDrilldownOptions {
  tree: CategoryTreeNode[];
  /** Nodi (e relativi sottoalberi) da rimuovere dalla navigazione — es. la categoria in eliminazione in ReassignCategoryModal. */
  excludeIds?: number[];
  /** Posizione di partenza (es. il valore già selezionato, per non forzare una nuova discesa completa ad ogni riapertura). */
  initialId?: number | null;
}

/**
 * Stato di navigazione drill-down headless per CategoryPickerField: un
 * livello alla volta (radici, poi figli diretti del nodo corrente), con path
 * per il breadcrumb — stessa idea di CategoryDrilldownNav (Esplora Articoli)
 * ma logica separata, non riusata: lì manca il concetto di "conferma" che
 * serve qui (Esplora naviga per filtrare risultati, qui si sceglie un valore
 * di form), quindi accoppiare i due usi nello stesso hook costerebbe più di
 * quanto farebbe risparmiare.
 */
export function useCategoryDrilldown({ tree, excludeIds = [], initialId = null }: UseCategoryDrilldownOptions) {
  const [currentId, setCurrentId] = useState<number | null>(initialId);

  const prunedTree = pruneExcluded(tree, excludeIds);
  const path = findCategoryPath(prunedTree, currentId);
  const currentNode = path.at(-1) ?? null;
  const visibleNodes = currentNode?.figlie ?? prunedTree;

  return {
    path,
    currentNode,
    visibleNodes,
    navigate: setCurrentId,
  };
}
