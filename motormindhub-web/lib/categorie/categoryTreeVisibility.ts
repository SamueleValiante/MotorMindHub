import type { CategoryTreeNode } from "./types";

export interface VisibleTreeRow {
  node: CategoryTreeNode;
  depth: number;
}

/**
 * Righe realmente visibili nell'albero (radici + figli dei soli nodi in
 * expandedIds), in ordine di visita — usata dalla roving-tabindex di
 * CategoryTree per calcolare il prossimo/precedente treeitem su Su/Giù/
 * Home/End senza dover ripescare il DOM.
 */
export function flattenVisible(
  tree: CategoryTreeNode[],
  expandedIds: ReadonlySet<number>,
  depth = 0
): VisibleTreeRow[] {
  return tree.flatMap((node) => [
    { node, depth },
    ...(expandedIds.has(node.id) ? flattenVisible(node.figlie, expandedIds, depth + 1) : []),
  ]);
}

/** Id di tutti i nodi con almeno una figlia — per "Espandi tutto" (CategoryTree). */
export function collectExpandableIds(tree: CategoryTreeNode[]): number[] {
  return tree.flatMap((node) => [
    ...(node.figlie.length > 0 ? [node.id] : []),
    ...collectExpandableIds(node.figlie),
  ]);
}

export interface PrunedTree {
  tree: CategoryTreeNode[];
  expandedIds: Set<number>;
}

/**
 * Filtra l'albero durante la ricerca in CategoryTree: tiene solo i nodi il
 * cui nome corrisponde (stesso confronto case-insensitive di prima) o che
 * hanno almeno un discendente che corrisponde — questi ultimi finiscono in
 * expandedIds per l'auto-espansione. Mostra il match nel suo contesto
 * gerarchico (es. "Freni" sotto "Impianto Frenante") invece di appiattire i
 * risultati come faceva la vecchia tabella.
 */
export function pruneToMatches(tree: CategoryTreeNode[], query: string): PrunedTree {
  const q = query.trim().toLowerCase();
  const expandedIds = new Set<number>();

  function walk(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
    return nodes.flatMap((node) => {
      const figlie = walk(node.figlie);
      const selfMatches = node.nome.toLowerCase().includes(q);
      if (figlie.length === 0 && !selfMatches) return [];
      if (figlie.length > 0) expandedIds.add(node.id);
      return [{ ...node, figlie }];
    });
  }

  return { tree: walk(tree), expandedIds };
}
