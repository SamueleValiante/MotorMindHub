export interface CategoryTreeNode {
  id: number;
  nome: string;
  descrizione: string | null;
  figlie: CategoryTreeNode[];
}

/** CategoryAncestorDTO (GestioneCategorie.getCategoryPath, ODD 2.3) — un segmento del breadcrumb. */
export interface CategoryAncestor {
  id: number;
  nome: string;
}
