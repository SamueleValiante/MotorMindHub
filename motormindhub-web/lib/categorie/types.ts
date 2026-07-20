export interface CategoryTreeNode {
  id: number;
  nome: string;
  descrizione: string | null;
  figlie: CategoryTreeNode[];
}
