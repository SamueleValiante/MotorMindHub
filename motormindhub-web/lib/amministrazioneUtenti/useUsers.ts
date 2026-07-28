import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { UserSummary } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; utenti: UserSummary[] }
  | { status: "error" };

/**
 * GET /api/v1/amministrazione-utenti/utenti (searchUsers, RF4.2, UC_22) —
 * solo GESTORE_UTENTI. Nessun parametro query/stato inviato: l'endpoint li
 * supporta lato server, ma tab e ricerca (mockup 39) filtrano lato client,
 * stesso pattern già usato da AuthorTable (Gestione Autori) — un solo
 * fetch, nessun round-trip per ogni cambio di tab/carattere digitato.
 */
export function useUsers(): State & { refetch: () => void } {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/amministrazione-utenti/utenti")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", utenti: await response.json() });
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
