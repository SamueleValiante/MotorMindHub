import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { CategoryTreeNode } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; tree: CategoryTreeNode[] }
  | { status: "error" };

/**
 * GET /api/v1/categorie — pubblico (permitAll in SecurityConfig), niente
 * token da allegare. `refetch` ricarica l'albero (usato dalle pagine di
 * gestione categorie dopo create/update/delete, dove la UI non è di sola
 * lettura come in Esplora/Editor articolo).
 */
export function useCategoryTree(): State & { refetch: () => void } {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/categorie", { skipAuth: true })
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", tree: await response.json() });
        } else {
          setState({ status: "error" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refetch = () => {
    setState({ status: "loading" });
    setReloadKey((key) => key + 1);
  };

  return { ...state, refetch };
}

/** Conta tutti i nodi dell'albero (radici + discendenti), usata per la stat "categorie tecniche" in Home. */
export function countCategories(tree: CategoryTreeNode[]): number {
  return tree.reduce((total, node) => total + 1 + countCategories(node.figlie), 0);
}

export interface FlatCategoryOption {
  id: number;
  nome: string;
  depth: number;
}

/**
 * Appiattisce l'albero in un elenco ordinato (radice, poi figlie, ricorsivo)
 * con la profondità di ciascun nodo: usato dal <select> categoria di Esplora
 * per mostrare l'intera gerarchia (non solo le radici, a differenza della
 * lista di Home) restando comunque un singolo controllo nativo — ogni
 * opzione invia un solo id esatto, l'espansione alle sottocategorie resta
 * lato server (searchArticles).
 */
export function flattenCategoryTree(tree: CategoryTreeNode[], depth = 0): FlatCategoryOption[] {
  return tree.flatMap((node) => [
    { id: node.id, nome: node.nome, depth },
    ...flattenCategoryTree(node.figlie, depth + 1),
  ]);
}
