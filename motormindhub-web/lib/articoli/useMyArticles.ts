import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { ArticleSummary, MyArticle } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; articoli: MyArticle[] }
  | { status: "error" };

/** Forma reale della risposta (confermata su Swagger, cfr. MyArticle in ./types): nidificata, non un ArticleSummaryDTO piatto. */
interface AuthorArticleSummaryResponse {
  articolo: ArticleSummary;
  numeroSalvataggi: number;
}

/**
 * GET /api/v1/articoli/me (getArticlesByAuthor) — solo Autore/Manager
 * Autori (RF2.1). Già ordinato dal backend per dataUltimoAggiornamento
 * discendente (findByAutoreIdOrderByDataUltimoAggiornamentoDesc): niente
 * riordinamento lato client. Appiattisce {articolo, numeroSalvataggi} in
 * MyArticle qui, una volta sola, così i consumer (I Miei Articoli,
 * Dashboard Autore) non devono conoscere la forma nidificata del DTO.
 */
export function useMyArticles(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/articoli/me")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          const dati: AuthorArticleSummaryResponse[] = await response.json();
          setState({
            status: "ready",
            articoli: dati.map((d) => ({ ...d.articolo, numeroSalvataggi: d.numeroSalvataggi })),
          });
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

  return state;
}
