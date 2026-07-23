import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { AuthorSummary } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; autori: AuthorSummary[] }
  | { status: "error" };

/** GET /api/v1/autori (listAuthors, RF3.2) — solo MANAGER_AUTORI. */
export function useAuthors(): State & { refetch: () => void } {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/autori")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", autori: await response.json() });
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
