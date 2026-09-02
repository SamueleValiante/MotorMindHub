"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { PencilIcon, LayersIcon } from "@/components/autore/icons";
import { TrashIcon } from "@/components/account/icons";
import { SearchIcon, ChevronDownIcon } from "@/components/public/icons";
import { EmptyState } from "@/components/empty-state/EmptyState";
import {
  flattenVisible,
  collectExpandableIds,
  pruneToMatches,
  type VisibleTreeRow,
} from "@/lib/categorie/categoryTreeVisibility";
import type { CategoryTreeNode } from "@/lib/categorie/types";

interface CategoryTreeProps {
  tree: CategoryTreeNode[];
  /** Solo il Manager Autori può eliminare (RF3.5) — l'Autore vede solo la matita di modifica. */
  canDelete: boolean;
  onEdit: (categoryId: number) => void;
  onDelete?: (node: CategoryTreeNode) => void;
}

/**
 * Albero categorie condiviso (mockup 27 lato Autore, 34 lato Manager) — vista
 * gerarchica vera (WAI-ARIA Tree View Pattern: role="tree"/"treeitem"/
 * "group", roving-tabindex, frecce per navigare/espandere/collassare),
 * sostituisce la tabella piatta con colonna "Categoria Padre" testuale: a 84
 * nodi/5 livelli l'indentazione visiva regge, il testo ripetuto per riga no
 * — stesso motivo già affrontato per il <select> di Esplora/editor
 * articolo. "Articoli" resta "—": CategoryTreeNodeDTO non porta un
 * conteggio articoli per categoria, il backend non espone questo dato oggi.
 *
 * I bottoni azione (Modifica/Elimina) sono <button> normali raggiungibili
 * con Tab, FUORI dalla roving-tabindex dei treeitem: la spec WAI-ARIA non
 * definisce un modo per includere controlli interattivi indipendenti dentro
 * un treeitem senza rompere la navigazione da tastiera del tree (le frecce
 * muovono il focus TRA treeitem, non dentro di essi) — l'alternativa
 * pienamente conforme sarebbe role="treegrid" con roving bidimensionale,
 * non scelta qui perché la complessità aggiuntiva non è giustificata a
 * questa scala (84 nodi, non migliaia).
 *
 * Ricerca: durante la digitazione l'albero mostra solo i nodi che
 * corrispondono + la catena di antenati fino alla radice (pruneToMatches),
 * con quegli antenati auto-espansi — il contesto gerarchico del match resta
 * visibile invece di appiattire i risultati. Lo stato di espansione manuale
 * (manualExpanded) non viene toccato durante la ricerca, quindi alla
 * cancellazione si torna esattamente a com'era prima.
 */
export function CategoryTree({ tree, canDelete, onEdit, onDelete }: CategoryTreeProps) {
  const [search, setSearch] = useState("");
  const [manualExpanded, setManualExpanded] = useState<Set<number>>(new Set());
  const [activeId, setActiveId] = useState<number | null>(null);
  const rowRefs = useRef(new Map<number, HTMLDivElement>());

  const isSearching = search.trim().length > 0;
  const pruned = useMemo(() => (isSearching ? pruneToMatches(tree, search) : null), [isSearching, tree, search]);
  const displayTree = pruned ? pruned.tree : tree;
  const expandedIds = pruned ? pruned.expandedIds : manualExpanded;

  const visibleRows = useMemo(() => flattenVisible(displayTree, expandedIds), [displayTree, expandedIds]);
  const indexById = useMemo(() => {
    const map = new Map<number, number>();
    visibleRows.forEach((row, i) => map.set(row.node.id, i));
    return map;
  }, [visibleRows]);
  const expandableIds = useMemo(() => collectExpandableIds(tree), [tree]);
  // Id dei nodi che hanno DAVVERO figli nell'albero reale (non in quello
  // filtrato dalla ricerca) — pruneToMatches sostituisce node.figlie con la
  // versione filtrata, quindi un nodo che matcha ma i cui figli non
  // matchano finirebbe con figlie:[] nella vista, apparendo una foglia:
  // usato per il bottone Elimina, che deve restare disabilitato anche
  // durante una ricerca se la categoria ha sottocategorie reali (il backend
  // rifiuterebbe comunque la richiesta con 409, ma lo stato disabilitato
  // dell'UI non deve mentire nel frattempo).
  const realExpandableIds = useMemo(() => new Set(expandableIds), [expandableIds]);

  // Mantiene sempre un treeitem attivo (roving tabindex) valido: al primo
  // render, dopo una ricerca che cambia l'insieme visibile, o se il nodo
  // attivo sparisce (es. eliminato) ricade sul primo elemento visibile.
  // Aggiustamento durante il render (non in un effect): visibleRows è
  // memoizzato, quindi cambia riferimento solo quando l'insieme visibile
  // cambia davvero — confrontarlo con l'ultimo visto è il modo corretto di
  // "derivare" questo stato senza il giro in più di un render supplementare
  // via useEffect (https://react.dev/learn/you-might-not-need-an-effect).
  const [prevVisibleRows, setPrevVisibleRows] = useState(visibleRows);
  if (visibleRows !== prevVisibleRows) {
    setPrevVisibleRows(visibleRows);
    if (visibleRows.length === 0) {
      setActiveId(null);
    } else if (activeId === null || !indexById.has(activeId)) {
      setActiveId(visibleRows[0].node.id);
    }
  }

  const toggleExpand = (id: number) => {
    // Durante la ricerca l'espansione è interamente derivata da
    // pruneToMatches (ogni antenato di un match è già forzato aperto): non
    // c'è nulla di significativo da alternare finché non si cancella la
    // query, quindi qui è un no-op invece di scrivere in manualExpanded
    // senza alcun effetto visibile immediato.
    if (isSearching) return;
    setManualExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const focusRow = (id: number) => {
    setActiveId(id);
    rowRefs.current.get(id)?.focus();
  };

  if (tree.length === 0) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
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
            className="w-full rounded-md bg-surface-raised py-3 pl-11 pr-4 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setManualExpanded(new Set(expandableIds))}
            disabled={isSearching || expandableIds.length === 0}
            className="rounded-md border border-chrome/40 px-3 py-2 font-heading text-xs font-bold uppercase tracking-wide text-chrome hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Espandi tutto
          </button>
          <button
            type="button"
            onClick={() => setManualExpanded(new Set())}
            disabled={isSearching || manualExpanded.size === 0}
            className="rounded-md border border-chrome/40 px-3 py-2 font-heading text-xs font-bold uppercase tracking-wide text-chrome hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Comprimi tutto
          </button>
        </div>
      </div>

      {displayTree.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="Nessun risultato"
          description="Nessuna categoria corrisponde alla ricerca."
        />
      ) : (
        <div
          role="tree"
          aria-label="Categorie"
          className="overflow-x-auto rounded-lg border border-paper/10 bg-carbon p-2"
        >
          {displayTree.map((node) => (
            <CategoryTreeRow
              key={node.id}
              node={node}
              depth={0}
              parentId={null}
              expandedIds={expandedIds}
              activeId={activeId}
              indexById={indexById}
              visibleRows={visibleRows}
              rowRefs={rowRefs}
              canDelete={canDelete}
              realExpandableIds={realExpandableIds}
              onEdit={onEdit}
              onDelete={onDelete}
              focusRow={focusRow}
              toggleExpand={toggleExpand}
              setActiveId={setActiveId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryTreeRowProps {
  node: CategoryTreeNode;
  depth: number;
  parentId: number | null;
  expandedIds: ReadonlySet<number>;
  activeId: number | null;
  indexById: ReadonlyMap<number, number>;
  visibleRows: VisibleTreeRow[];
  rowRefs: React.RefObject<Map<number, HTMLDivElement>>;
  canDelete: boolean;
  realExpandableIds: ReadonlySet<number>;
  onEdit: (categoryId: number) => void;
  onDelete?: (node: CategoryTreeNode) => void;
  focusRow: (id: number) => void;
  toggleExpand: (id: number) => void;
  setActiveId: (id: number) => void;
}

function CategoryTreeRow({
  node,
  depth,
  parentId,
  expandedIds,
  activeId,
  indexById,
  visibleRows,
  rowRefs,
  canDelete,
  realExpandableIds,
  onEdit,
  onDelete,
  focusRow,
  toggleExpand,
  setActiveId,
}: CategoryTreeRowProps) {
  const hasChildren = node.figlie.length > 0;
  const hasRealChildren = realExpandableIds.has(node.id);
  const expanded = expandedIds.has(node.id);
  const isActive = activeId === node.id;
  const index = indexById.get(node.id) ?? -1;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Impedisce che il tasto raggiunga anche il treeitem antenato (lo stesso
    // div DOM lo contiene, via il role="group" annidato): senza questo,
    // premere una freccia su un nodo profondo farebbe scattare ANCHE la
    // gestione tasti del genitore che lo racchiude.
    event.stopPropagation();

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        const next = visibleRows[index + 1];
        if (next) focusRow(next.node.id);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const prev = visibleRows[index - 1];
        if (prev) focusRow(prev.node.id);
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        if (!hasChildren) break;
        if (!expanded) {
          toggleExpand(node.id);
        } else {
          const child = visibleRows[index + 1];
          if (child) focusRow(child.node.id);
        }
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        if (hasChildren && expanded) {
          toggleExpand(node.id);
        } else if (parentId !== null) {
          focusRow(parentId);
        }
        break;
      }
      case "Home": {
        event.preventDefault();
        if (visibleRows[0]) focusRow(visibleRows[0].node.id);
        break;
      }
      case "End": {
        event.preventDefault();
        const last = visibleRows[visibleRows.length - 1];
        if (last) focusRow(last.node.id);
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        if (hasChildren) toggleExpand(node.id);
        break;
      }
      default:
        break;
    }
  };

  const stop = (event: MouseEvent) => event.stopPropagation();

  return (
    <div
      ref={(el) => {
        if (el) rowRefs.current.set(node.id, el);
        else rowRefs.current.delete(node.id);
      }}
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-level={depth + 1}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        event.stopPropagation();
        setActiveId(node.id);
        if (hasChildren) toggleExpand(node.id);
      }}
      className="outline-none"
    >
      <div
        style={{ paddingLeft: `${depth * 20}px` }}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {hasChildren ? (
            <ChevronDownIcon
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 text-fog transition-transform ${expanded ? "" : "-rotate-90"}`}
            />
          ) : (
            <span aria-hidden="true" className="w-4 shrink-0" />
          )}
          <span className="truncate text-sm text-paper">{node.nome}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm text-chrome">—</span>
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              onEdit(node.id);
            }}
            aria-label={`Modifica ${node.nome}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-asphalt/80 text-chrome hover:text-accent"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={(event) => {
                stop(event);
                onDelete?.(node);
              }}
              disabled={hasRealChildren}
              aria-label={`Elimina ${node.nome}`}
              title={hasRealChildren ? "Contiene sottocategorie, elimina prima quelle" : undefined}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-asphalt/80 text-chrome hover:text-ember disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-chrome"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div role="group">
          {node.figlie.map((child) => (
            <CategoryTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              parentId={node.id}
              expandedIds={expandedIds}
              activeId={activeId}
              indexById={indexById}
              visibleRows={visibleRows}
              rowRefs={rowRefs}
              canDelete={canDelete}
              realExpandableIds={realExpandableIds}
              onEdit={onEdit}
              onDelete={onDelete}
              focusRow={focusRow}
              toggleExpand={toggleExpand}
              setActiveId={setActiveId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
