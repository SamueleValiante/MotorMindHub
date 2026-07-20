import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { ArticleSearchResult, SearchArticlesParams } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; result: ArticleSearchResult }
  | { status: "error" };

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
  return qs.toString();
}

/** GET /api/v1/articoli (searchArticles) — pubblico (permitAll in SecurityConfig, RF1.1/RF1.2). */
export function useArticleSearch(params: SearchArticlesParams): State {
  const queryString = buildQueryString(params);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/v1/articoli${queryString ? `?${queryString}` : ""}`, { skipAuth: true })
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", result: await response.json() });
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
  }, [queryString]);

  return state;
}
