"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import { toast } from "@/lib/toast/toast";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Pagination } from "@/components/public/Pagination";
import { SearchIcon } from "@/components/public/icons";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { BookmarkIcon } from "@/components/account/icons";
import type { SavedArticle, TipoLista } from "@/lib/articoli/types";

const PER_PAGINA = 28;

type Filtro = "TUTTI" | TipoLista;

const TAB_LABELS: Record<Filtro, string> = {
  TUTTI: "Tutti",
  PREFERITI: "Preferiti",
  LEGGI_PIU_TARDI: "Leggi più tardi",
};

const PILL_LABELS: Record<TipoLista, string> = {
  PREFERITI: "Preferiti",
  LEGGI_PIU_TARDI: "Leggi più tardi",
};

type State =
  | { status: "loading" }
  | { status: "ready"; saved: SavedArticle[] }
  | { status: "error" };

/**
 * I Miei Salvataggi (mockup 17): getSavedArticles, una singola lista con
 * tab di filtro (non due sezioni separate) — il mockup conta "TUTTI (14)"
 * = "PREFERITI (6)" + "LEGGI PIÙ TARDI (8)", quindi ogni riga è una coppia
 * (articolo, tipoLista): un articolo salvato in entrambe le liste compare
 * due volte, ciascuna con la propria pill e il proprio bottone di
 * rimozione mirato a quella lista — non deduplicato.
 *
 * Rimozione diretta dalla card (removeArticleFromList), non un menu come
 * in SaveMenu sul Dettaglio Articolo: qui il tipoLista di ogni riga è già
 * noto, non c'è ambiguità da chiedere.
 */
export default function SalvataggiPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [filtro, setFiltro] = useState<Filtro>("TUTTI");
  const [search, setSearch] = useState("");
  const [pagina, setPagina] = useState(0);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/articoli/salvataggi")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", saved: await response.json() });
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
  }, []);

  const handleRemove = async (articleId: number, tipoLista: TipoLista) => {
    const key = `${articleId}-${tipoLista}`;
    setRemovingKey(key);

    const response = await apiFetch(
      `/api/v1/articoli/${articleId}/salvataggi/${tipoLista}`,
      {
        method: "DELETE",
      },
    );

    setRemovingKey(null);

    if (response.ok) {
      setState((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              saved: prev.saved.filter(
                (s) =>
                  !(s.articolo.id === articleId && s.tipoLista === tipoLista),
              ),
            }
          : prev,
      );
      toast.success("Rimosso dai salvataggi.");
    } else {
      toast.error("Non è stato possibile rimuovere l'articolo. Riprova.");
    }
  };

  const saved = state.status === "ready" ? state.saved : [];
  const counts: Record<Filtro, number> = {
    TUTTI: saved.length,
    PREFERITI: saved.filter((s) => s.tipoLista === "PREFERITI").length,
    LEGGI_PIU_TARDI: saved.filter((s) => s.tipoLista === "LEGGI_PIU_TARDI")
      .length,
  };
  // Ricerca client-side sugli articoli già scaricati (getSavedArticles non ha parametri di query):
  // titolo, estratto, categoria e autore, dentro la lista selezionata (o in entrambe con "Tutti").
  const needle = search.trim().toLowerCase();
  const filtrati = (
    filtro === "TUTTI" ? saved : saved.filter((s) => s.tipoLista === filtro)
  ).filter(
    (s) =>
      needle === "" ||
      [
        s.articolo.titolo,
        s.articolo.estratto ?? "",
        s.articolo.categoriaNome,
        s.articolo.autoreNome,
      ].some((campo) => campo.toLowerCase().includes(needle)),
  );
  const totalPages = Math.max(1, Math.ceil(filtrati.length / PER_PAGINA));
  const paginaCorrente = Math.min(pagina, totalPages - 1);
  const visibili = filtrati.slice(
    paginaCorrente * PER_PAGINA,
    (paginaCorrente + 1) * PER_PAGINA,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">
          Area personale
        </p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          I Miei Salvataggi
        </h1>
      </div>

      {state.status === "loading" ? (
        <p className="mmh-loading text-sm text-fog">Caricamento…</p>
      ) : state.status === "error" ? (
        <p className="text-sm text-ember">
          Non è stato possibile caricare i tuoi salvataggi.
        </p>
      ) : saved.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon className="h-6 w-6" />}
          title="Nessun salvataggio ancora"
          description="Gli articoli che aggiungi ai Preferiti o a Leggi più tardi compariranno qui."
          action={{ label: "Esplora articoli", href: "/esplora" }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="cerca-salvataggi" className="sr-only">
              Cerca tra gli articoli salvati
            </label>
            <input
              id="cerca-salvataggi"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPagina(0);
              }}
              placeholder="Cerca tra gli articoli salvati…"
              className="w-full max-w-sm rounded-md bg-surface-raised px-4 py-3 text-sm text-chrome outline-none focus:ring-2 focus:ring-accent"
            />

            <div className="flex flex-wrap gap-2 rounded-lg bg-carbon p-2">
              {(Object.keys(TAB_LABELS) as Filtro[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setFiltro(tab);
                    setPagina(0);
                  }}
                  aria-pressed={filtro === tab}
                  className={`rounded-md px-4 py-2 font-heading text-xs font-bold uppercase tracking-wide ${
                    filtro === tab ? "bg-accent text-asphalt" : "text-chrome"
                  }`}
                >
                  {TAB_LABELS[tab]} ({counts[tab]})
                </button>
              ))}
            </div>
          </div>

          {visibili.length === 0 ? (
            needle !== "" ? (
              <EmptyState
                icon={<SearchIcon className="h-6 w-6" />}
                title="Nessun risultato"
                description="Nessun articolo salvato corrisponde alla ricerca."
              />
            ) : (
              <EmptyState
                icon={<BookmarkIcon className="h-6 w-6" />}
                title={`Nessun articolo in ${TAB_LABELS[filtro]}`}
                description="Non hai ancora salvato nessun articolo in questa lista."
              />
            )
          ) : (
            <div className="grid gap-6 rounded-lg border border-paper/10 bg-carbon p-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibili.map((s) => {
                const key = `${s.articolo.id}-${s.tipoLista}`;
                return (
                  <ArticleCard
                    key={key}
                    articolo={s.articolo}
                    badge={
                      <span className="inline-block w-fit rounded bg-surface-raised px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-fog">
                        {PILL_LABELS[s.tipoLista]}
                      </span>
                    }
                    action={
                      <button
                        type="button"
                        disabled={removingKey === key}
                        onClick={(event) => {
                          event.preventDefault();
                          void handleRemove(s.articolo.id, s.tipoLista);
                        }}
                        aria-label={`Rimuovi da ${PILL_LABELS[s.tipoLista]}`}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-asphalt/80 text-accent disabled:opacity-50"
                      >
                        <BookmarkIcon className="h-4 w-4" />
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}

          <Pagination
            pagina={paginaCorrente}
            totalPages={totalPages}
            onChange={setPagina}
          />
        </>
      )}
    </div>
  );
}
