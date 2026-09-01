import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { ArticleSearchResult, SearchArticlesParams } from "./types";

type FetchState =
  | { status: "loading" }
  | { status: "ready"; result: ArticleSearchResult }
  | { status: "error" };

type State =
  | { status: "loading"; isRefetching: false }
  | { status: "ready"; result: ArticleSearchResult; isRefetching: boolean }
  | { status: "error"; isRefetching: false };

function buildQueryString(params: SearchArticlesParams): string {
  const qs = new URLSearchParams();
  if (params.query) qs.set("query", params.query);
  // Passato cosi' com'e' al backend: nessuna espansione delle sottocategorie
  // lato client, searchArticles la gestisce gia' server-side (RF1.2).
  params.categoriaIds?.forEach((id) => qs.append("categoriaIds", String(id)));
  if (params.pagina !== undefined) qs.set("pagina", String(params.pagina));
  if (params.dimensionePagina !== undefined) {
    qs.set("dimensionePagina", String(params.dimensionePagina));
  }
  if (params.ordinamento) qs.set("ordinamento", params.ordinamento);
  // Solo quando esplicitamente false: omettere il parametro quando
  // undefined/true lascia il default lato server (espande) invariato per
  // ogni chiamante che non lo imposta - stesso principio di categoriaIds
  // sopra, nessuna logica di espansione duplicata qui.
  if (params.espandiSottocategorie === false) qs.set("espandiSottocategorie", "false");
  return qs.toString();
}

/**
 * GET /api/v1/articoli (searchArticles) — pubblico (permitAll in SecurityConfig, RF1.1/RF1.2).
 *
 * Quando `params` cambia mentre e' gia' presente un risultato precedente
 * (tipicamente la ricerca live testuale di Esplora, debounced in
 * EsploraContent), lo stato resta "ready" con l'ultimo risultato noto e
 * isRefetching passa a true, invece di tornare a "loading" — stesso
 * pattern gia' usato per gli andamenti a grafico (useAndamentoLetture e
 * affini) per evitare un lampeggio jarring a ogni fetch. I chiamanti che
 * non leggono isRefetching (page.tsx, manager/page.tsx,
 * ArticleDetailContent) non sono affetti: i loro `params` non cambiano mai
 * dopo il mount, quindi non rientrano mai nel ramo "refetch".
 *
 * L'AbortController cancella davvero la richiesta superata (non si limita
 * a scartarne la risposta) quando `params` cambia di nuovo prima che
 * risponda — utile con la ricerca live, dove una digitazione veloce puo'
 * generare piu' richieste in volo.
 */
export function useArticleSearch(params: SearchArticlesParams): State {
  const queryString = buildQueryString(params);
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    apiFetch(`/api/v1/articoli${queryString ? `?${queryString}` : ""}`, {
      skipAuth: true,
      signal: controller.signal,
    })
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", result: await response.json() });
        } else {
          setState({ status: "error" });
        }
      })
      .catch(() => {
        // cancelled e' gia' true quando questo catch intercetta il reject
        // causato dal controller.abort() della cleanup qui sotto (l'ordine
        // e' sempre cancelled=true prima di abort()): non serve distinguere
        // l'AbortError da un errore di rete vero, cancelled basta da solo.
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [queryString]);

  // Cfr. commento sopra il return in useAndamentoLetture.ts: stesso
  // pattern "tieni il fotogramma precedente" durante un refetch.
  const [ultimoRisultato, setUltimoRisultato] = useState<ArticleSearchResult | null>(null);
  if (state.status === "ready" && state.result !== ultimoRisultato) {
    setUltimoRisultato(state.result);
  }

  if (state.status === "ready") {
    return { status: "ready", result: state.result, isRefetching: false };
  }
  if (state.status === "loading" && ultimoRisultato) {
    return { status: "ready", result: ultimoRisultato, isRefetching: true };
  }
  return state.status === "error" ? { status: "error", isRefetching: false } : { status: "loading", isRefetching: false };
}
