"use client";

import { useState } from "react";
import { PencilIcon, LayersIcon } from "@/components/autore/icons";
import { TrashIcon } from "@/components/account/icons";
import { SearchIcon } from "@/components/public/icons";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { flattenCategoryRows, type FlatCategoryRow } from "@/lib/categorie/categoryMutations";
import type { CategoryTreeNode } from "@/lib/categorie/types";

interface CategoryTableProps {
  tree: CategoryTreeNode[];
  /** Solo il Manager Autori può eliminare (RF3.5) — l'Autore vede solo la matita di modifica. */
  canDelete: boolean;
  onEdit: (categoryId: number) => void;
  onDelete?: (row: FlatCategoryRow) => void;
}

/**
 * Tabella condivisa Categorie (mockup 27 lato Autore, 34 lato Manager):
 * lista flat con colonna "Categoria Padre" (nome del padre o "—" per le
 * radici) — la gerarchia vera si vede solo nel <select> del form, non qui.
 *
 * "Articoli" resta "—": CategoryTreeNodeDTO (getCategoryTree) non porta un
 * conteggio articoli per categoria, il backend non espone questo dato oggi.
 */
export function CategoryTable({ tree, canDelete, onEdit, onDelete }: CategoryTableProps) {
  const [search, setSearch] = useState("");

  const rows = flattenCategoryRows(tree);
  const filtrate = rows.filter((row) => row.nome.toLowerCase().includes(search.trim().toLowerCase()));

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<LayersIcon className="h-6 w-6" />}
        title="Nessuna categoria ancora"
        description="Le categorie che crei compariranno qui, organizzate nell'albero di navigazione."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <label htmlFor="cerca-categoria" className="sr-only">
          Cerca categoria
        </label>
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
        <input
          id="cerca-categoria"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca categoria…"
          className="w-full rounded-md bg-surface-raised py-3 pl-11 pr-4 text-sm text-chrome outline-none focus:ring-2 focus:ring-amber"
        />
      </div>

      {filtrate.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="Nessun risultato"
          description="Nessuna categoria corrisponde alla ricerca."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-paper/10 bg-carbon">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-xs uppercase tracking-wide text-fog">
                <th className="px-6 py-4 font-heading font-semibold">Nome</th>
                <th className="px-6 py-4 font-heading font-semibold">Categoria Padre</th>
                <th className="px-6 py-4 font-heading font-semibold">Articoli</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {filtrate.map((row) => (
                <tr key={row.id} className="border-b border-paper/10 last:border-0">
                  <td className="px-6 py-4 text-paper">{row.nome}</td>
                  <td className="px-6 py-4 text-chrome">{row.categoriaPadreNome ?? "—"}</td>
                  <td className="px-6 py-4 text-chrome">—</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(row.id)}
                        aria-label={`Modifica ${row.nome}`}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-asphalt/80 text-chrome hover:text-amber"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete?.(row)}
                          aria-label={`Elimina ${row.nome}`}
                          className="flex h-9 w-9 items-center justify-center rounded-md bg-asphalt/80 text-chrome hover:text-ember"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
