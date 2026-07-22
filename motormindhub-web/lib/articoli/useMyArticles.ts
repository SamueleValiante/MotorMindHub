import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { ArticleSummary } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; articoli: ArticleSummary[] }
  | { status: "error" };

/**
 * GET /api/v1/articoli/me (getArticlesByAuthor) — solo Autore/Manager
 * Autori (RF2.1). Già ordinato dal backend per dataUltimoAggiornamento
 * discendente (findByAutoreIdOrderByDataUltimoAggiornamentoDesc): niente
 * riordinamento lato client.
 */
export function useMyArticles(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/articoli/me")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", articoli: await response.json() });
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
