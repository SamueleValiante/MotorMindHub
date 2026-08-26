import type { CategoryTreeNode } from "./types";

/**
 * Risale l'albero (gia' in memoria, nessuna nuova chiamata di rete) e
 * restituisce il percorso radice -> nodo corrente, usato sia per il
 * breadcrumb sia per determinare quali figli mostrare nel drill-down
 * (CategoryDrilldownNav). `[]` quando currentId e' null (livello radice)
 * o non trovato nell'albero (es. id da un link ormai stantio).
 */
export function findCategoryPath(
  tree: CategoryTreeNode[],
  currentId: number | null
): CategoryTreeNode[] {
  if (currentId === null) return [];

  function cerca(nodes: CategoryTreeNode[]): CategoryTreeNode[] | null {
    for (const node of nodes) {
      if (node.id === currentId) return [node];
      const sottopercorso = cerca(node.figlie);
      if (sottopercorso) return [node, ...sottopercorso];
    }
    return null;
  }

  return cerca(tree) ?? [];
}
