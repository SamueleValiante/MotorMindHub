import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { PendingArticle } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; articoli: PendingArticle[] }
  | { status: "error" };

/** GET /api/v1/autori/articoli-in-attesa (getPendingArticles, RF3.1/RF3.6) — solo MANAGER_AUTORI. */
export function usePendingArticles(): State & { refetch: () => void } {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/autori/articoli-in-attesa")
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
  }, [reloadKey]);

  const refetch = () => {
    setState({ status: "loading" });
    setReloadKey((key) => key + 1);
  };

  return { ...state, refetch };
}
