import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { DeletionRequestQueueItem } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; richieste: DeletionRequestQueueItem[] }
  | { status: "error" };

/**
 * GET /api/v1/amministrazione-utenti/richieste-cancellazione
 * (getDeletionRequestsQueue, RF4.6, UC_25) — solo GESTORE_UTENTI. Nessun
 * filtro server-side per stato: restituisce sempre l'intera coda (verificato
 * sull'implementazione, findAllByOrderByDataRichiestaDesc).
 */
export function useDeletionRequestsQueue(): State & { refetch: () => void } {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/amministrazione-utenti/richieste-cancellazione")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", richieste: await response.json() });
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
