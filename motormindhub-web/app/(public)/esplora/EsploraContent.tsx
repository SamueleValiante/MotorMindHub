"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useArticleSearch } from "@/lib/articoli/useArticleSearch";
import { useCategoryTree } from "@/lib/categorie/useCategoryTree";
import { findCategoryPath } from "@/lib/categorie/categoryDrilldown";
import { CategoryDrilldownNav } from "@/components/public/CategoryDrilldownNav";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Pagination } from "@/components/public/Pagination";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { SearchIcon } from "@/components/public/icons";
import type { OrdinamentoArticoli } from "@/lib/articoli/types";

const SORT_OPTIONS: { value: OrdinamentoArticoli; label: string }[] = [
  { value: "PIU_RECENTI", label: "Più recenti" },
  { value: "PIU_LETTI", label: "Più lette" },
  { value: "IN_EVIDENZA", label: "In evidenza" },
];

const DIMENSIONE_PAGINA = 6;

// Debounce della ricerca testuale live: abbastanza breve da sentirsi
// "immediato" a fine digitazione, abbastanza lungo da non generare una
// richiesta per ogni tasto premuto (l'endpoint è pubblico e soggetto a
// rate limit — 60/min letture, cfr. CLAUDE.md — ma anche a un ritmo di
// battitura sostenuto, molto più veloce di una lettera ogni 350ms, il
// debounce resta ben sotto quella soglia).
const QUERY_DEBOUNCE_MS = 350;

/**
 * Esplora Articoli (mockup 02). Il pannello "Filtri di ricerca" del
 * mockup mostra anche COMPONENTE (checkbox) e TEMPO DI LETTURA (dropdown):
 * omessi qui, searchArticles non ha alcun parametro per filtrare per
 * componente o per fascia di tempo di lettura — mostrarli avrebbe significato
 * un filtro che sembra funzionare ma non fa nulla, stessa disciplina già
 * applicata altrove (fotoProfilo, segnalazione contenuto). Aggiunta invece
 * una ricerca testuale: non è nel mockup di questa schermata, ma "Cerca"
 * in Home rimanda proprio a /esplora?query=..., quindi serve un modo per
 * vederla/modificarla una volta atterrati qui — query è un parametro reale
 * di searchArticles, non un'invenzione.
 *
 * Stato nell'URL (query, categoriaIds, ordinamento, pagina): permette di
 * arrivare qui già filtrati da un link esterno (Home → categoria, Home →
 * ricerca) e rende i risultati bookmarkabili/condivisibili.
 *
 * Quattro filtri, quattro tempi diversi — nessuno gated da "Applica
 * filtri" tranne la ricerca testuale, e ora nemmeno quella:
 *  - categoria (drill-down) e ordinamento (bottoni): già live, invariati
 *    da prima di questo commento — un click naviga subito.
 *  - pagina: live, invariata (click sul numero).
 *  - ricerca testuale: ERA l'unico campo gated dal submit del form. Ora è
 *    live anch'essa (debounced, sotto), col bottone "Cerca" che resta
 *    come azione esplicita ridondante — forza subito la query digitata
 *    ignorando il debounce residuo, utile a chi preferisce cliccare o
 *    vuole il risultato senza aspettare la pausa.
 */
export function EsploraContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get("query") ?? "";
  const categoriaId = searchParams.get("categoriaIds");
  const ordinamento = (searchParams.get("ordinamento") as OrdinamentoArticoli | null) ?? "PIU_RECENTI";
  const pagina = Number(searchParams.get("pagina") ?? 0);

  // Stato "bozza" del campo di ricerca: riflette ogni tasto premuto
  // all'istante (input controllato, nessun ritardo percepito nello
  // scrivere), ma raggiunge l'URL — e quindi la fetch — solo dopo il
  // debounce sotto, o subito se si preme "Cerca".
  const [draftQuery, setDraftQuery] = useState(query);

  // Distingue esplicitamente le due chiamate a searchArticles che convivono
  // su questa pagina (stesso principio del commento sopra su query/categoria:
  // due percorsi, non un flag ambiguo). false all'atterraggio su questa
  // pagina in QUALUNQUE modo (link esterno da Home, bookmark, refresh): in
  // quel momento nessun click sull'albero e' ancora avvenuto, quindi
  // l'eventuale categoriaIds gia' nell'URL segue il comportamento di
  // sempre (aggregato, RF1.2/TC11.2) - es. "Fiat" da Home deve continuare a
  // mostrare tutti gli articoli del marchio, non zero solo perche' il nodo
  // "Fiat" in se' e' puramente organizzativo. Diventa true (e resta tale
  // per il resto della sessione su questa pagina) alla prima chiamata a
  // handleCategoryNavigate: da quel momento in poi, ogni click sull'albero
  // (compresi quelli sul breadcrumb per risalire) e' per definizione
  // "innescato dalla navigazione ad albero" e riflette solo il nodo esatto.
  const [categoryNavAttiva, setCategoryNavAttiva] = useState(false);

  const categorie = useCategoryTree();

  const results = useArticleSearch({
    query: query || undefined,
    // Un solo id, così come scelto: nessuna espansione lato client in
    // nessuno dei due casi, la differenza (aggregato o esatto) la fa solo
    // espandiSottocategorie, applicato server-side (RF1.2 / nota ODD §2.2).
    categoriaIds: categoriaId ? [Number(categoriaId)] : undefined,
    espandiSottocategorie: categoryNavAttiva ? false : undefined,
    ordinamento,
    pagina,
    dimensionePagina: DIMENSIONE_PAGINA,
  });

  // Legge la base da window.location.search (non dalla `searchParams`
  // catturata al render): con la ricerca live sotto, il patch di "query"
  // può scattare con un ritardo (debounce) durante il quale un'altra patch
  // indipendente (es. click sul drill-down categoria) può già essere stata
  // applicata. Basarsi su un valore sempre fresco al momento della singola
  // chiamata evita che l'una sovrascriva l'altra con uno snapshot stantio.
  // push di default (comportamento invariato per categoria/ordinamento/
  // paginazione, cfr. test e2e sul tasto Indietro); push:false (replace)
  // per la ricerca testuale, live per definizione — cfr. sotto.
  const updateParams = useCallback(
    (patch: Record<string, string | null>, opts: { push?: boolean } = {}) => {
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const url = `/esplora${next.toString() ? `?${next.toString()}` : ""}`;
      if (opts.push === false) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [router]
  );

  // Debounce della ricerca live: un timer per pausa di digitazione, non uno
  // per tasto. Il ref (non solo la chiusura dell'effetto) permette al
  // bottone "Cerca" di cancellarlo esplicitamente e applicare subito,
  // senza dipendere dai tempi di un nuovo render per liberarlo.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (draftQuery === query) return;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      // replace, non push: ogni pausa nella digitazione non deve creare una
      // voce di cronologia, altrimenti "Indietro" richiederebbe un click
      // per ogni pausa fatta scrivendo invece che per ogni ricerca voluta.
      updateParams({ query: draftQuery || null, pagina: null }, { push: false });
    }, QUERY_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [draftQuery, query, updateParams]);

  function handleApplyFilters(event: React.FormEvent) {
    event.preventDefault();
    // Ignora il debounce residuo: "Cerca" è un'azione esplicita, il
    // risultato non deve aspettare la pausa che avrebbe altrimenti innescato
    // la ricerca live sopra.
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    // Non tocca categoriaIds: la categoria naviga gia' da sola a ogni click
    // del drill-down (handleCategoryNavigate), un submit qui non deve
    // sovrascriverla con uno stato "draft" che per la categoria non esiste piu'.
    updateParams({ query: draftQuery || null, pagina: null }, { push: false });
  }

  function handleCategoryNavigate(id: number | null) {
    setCategoryNavAttiva(true);
    updateParams({ categoriaIds: id !== null ? String(id) : null, pagina: null });
  }

  function handleSortChange(value: OrdinamentoArticoli) {
    updateParams({ ordinamento: value, pagina: null });
  }

  const totalPages =
    results.status === "ready"
      ? Math.max(1, Math.ceil(results.result.totaleRisultati / DIMENSIONE_PAGINA))
      : 1;

  const categoriaCorrente =
    categorie.status === "ready"
      ? findCategoryPath(categorie.tree, categoriaId ? Number(categoriaId) : null).at(-1)
      : undefined;
  const categoriaNomeSelezionata = categoriaCorrente?.nome;
  const totaleRisultati = results.status === "ready" ? results.result.totaleRisultati : null;

  // Zero risultati su un nodo puramente organizzativo (ha sotto-categorie,
  // quindi "vuoto" per come e' pensata la tassonomia, non un filtro che non
  // ha trovato nulla) merita un messaggio diverso da quello generico: non
  // deve leggersi come un errore/ricerca fallita quando in realta' basta
  // scendere di un altro livello per trovare gli articoli veri.
  const nodoOrganizzativoVuoto =
    categoryNavAttiva && !!categoriaCorrente && categoriaCorrente.figlie.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div>
        <p className="font-heading text-xs font-bold uppercase tracking-wide text-accent">
          Catalogo articoli
        </p>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide text-paper sm:text-4xl">
          Esplora articoli
        </h1>
        <p className="mt-2 text-sm text-fog">
          {totaleRisultati ?? "…"} guide tecniche, schede e approfondimenti verificati dalla
          redazione.
        </p>
      </div>

      <form onSubmit={handleApplyFilters} className="flex flex-col gap-6 rounded-lg bg-carbon p-6">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-paper">
          Filtri di ricerca
        </h2>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="esplora-query"
            className="font-heading text-xs font-semibold uppercase tracking-wide text-chrome"
          >
            Ricerca testuale
          </label>
          <input
            id="esplora-query"
            type="search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Cerca impianto frenante, motorizzazioni, guide all'acquisto…"
            className="rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-accent px-5 py-3 font-heading text-sm font-bold uppercase tracking-wide text-asphalt"
        >
          Applica filtri
        </button>
      </form>

      <div className="flex flex-col gap-4 rounded-lg bg-carbon p-6">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-paper">
          Categoria
        </h2>
        {categorie.status === "ready" && (
          <CategoryDrilldownNav
            tree={categorie.tree}
            currentId={categoriaId ? Number(categoriaId) : null}
            onNavigate={handleCategoryNavigate}
          />
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* aria-live: la ricerca ora si aggiorna senza un'azione esplicita che
            uno screen reader percepirebbe altrimenti (submit, navigazione) —
            annuncia il conteggio aggiornato quando una fetch (iniziale o
            live) va a buon fine. Non durante un refetch (isRefetching):
            annuncia solo il conteggio finale, non uno stato intermedio. */}
        <p className="text-xs uppercase tracking-wide text-fog" aria-live="polite">
          {totaleRisultati ?? "…"} risultati
          {categoriaNomeSelezionata
            ? ` per "${categoriaNomeSelezionata}"`
            : query
              ? ` per "${query}"`
              : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSortChange(opt.value)}
              aria-pressed={ordinamento === opt.value}
              className={`rounded-md px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide ${
                ordinamento === opt.value
                  ? "bg-accent text-asphalt"
                  : "border border-chrome/40 text-chrome"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Durante un refetch (query live, categoria o ordinamento cambiati)
          isRefetching e' true e results.result e' ancora l'ultimo valido:
          si tiene il render precedente a opacita' ridotta invece di uno
          skeleton pieno che sostituisce tutto — stesso pattern gia' usato
          per i grafici andamento (AndamentoCharts/AndamentoChartsAutori). */}
      <div className={`transition-opacity ${results.isRefetching ? "opacity-60" : "opacity-100"}`}>
        {results.status === "ready" && results.result.articoli.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="h-6 w-6" />}
            title={nodoOrganizzativoVuoto ? "Categoria organizzativa" : "Nessun risultato"}
            description={
              nodoOrganizzativoVuoto
                ? `"${categoriaNomeSelezionata}" raggruppa altre categorie ma non ha articoli propri: scegli una delle sotto-categorie qui sopra.`
                : "Nessun articolo corrisponde ai filtri applicati. Prova a modificarli."
            }
          />
        ) : results.status === "ready" ? (
          <div className="grid gap-6 rounded-lg border border-paper/10 bg-carbon p-6 md:grid-cols-2">
            {results.result.articoli.map((articolo) => (
              <ArticleCard key={articolo.id} articolo={articolo} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-fog">Caricamento…</p>
        )}
      </div>

      <Pagination pagina={pagina} totalPages={totalPages} onChange={(p) => updateParams({ pagina: String(p) })} />
    </div>
  );
}
