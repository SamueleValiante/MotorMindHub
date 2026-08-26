import { findCategoryPath } from "@/lib/categorie/categoryDrilldown";
import type { CategoryTreeNode } from "@/lib/categorie/types";

interface CategoryDrilldownNavProps {
  tree: CategoryTreeNode[];
  currentId: number | null;
  onNavigate: (id: number | null) => void;
}

/**
 * Navigazione categorie a drill-down (Esplora Articoli): a differenza del
 * vecchio <select> piatto (una singola lista di 84 nodi a 4-5 livelli,
 * illeggibile a quella profondita'), mostra un livello alla volta - le
 * radici, poi solo i figli diretti del nodo scelto, ricorsivamente - con un
 * breadcrumb per risalire. L'albero e' gia' tutto in memoria (useCategoryTree,
 * pochi nodi ai volumi attesi): nessuna nuova chiamata di rete a ogni click,
 * solo una ricerca locale del percorso (findCategoryPath).
 *
 * L'aggregazione degli articoli di un ramo (inclusi tutti i discendenti, non
 * solo quelli attaccati al nodo esatto) resta lato server (RF1.2,
 * GestioneArticoli.espandiConSottocategorie) - qui si passa un solo id,
 * esattamente come faceva il <select> che sostituisce.
 */
export function CategoryDrilldownNav({ tree, currentId, onNavigate }: CategoryDrilldownNavProps) {
  const path = findCategoryPath(tree, currentId);
  const currentNode = path.at(-1) ?? null;
  const figli = currentNode?.figlie ?? tree;

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Percorso categoria" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <button
          type="button"
          onClick={() => onNavigate(null)}
          aria-current={currentId === null ? "location" : undefined}
          className={`rounded-md px-2 py-1 font-heading font-bold uppercase tracking-wide ${
            currentId === null ? "bg-accent text-asphalt" : "text-chrome hover:text-accent"
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
                onClick={() => onNavigate(categoria.id)}
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

      {figli.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sottocategorie">
          {figli.map((figlio) => (
            <button
              key={figlio.id}
              type="button"
              onClick={() => onNavigate(figlio.id)}
              className="rounded-md border border-chrome/40 px-4 py-2 text-left text-sm text-chrome hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
            >
              {figlio.nome}
            </button>
          ))}
        </div>
      ) : (
        currentNode && (
          <p className="text-xs text-fog">
            Nessuna sotto-categoria: i risultati sotto mostrano gli articoli di &ldquo;{currentNode.nome}&rdquo;.
          </p>
        )
      )}
    </div>
  );
}
