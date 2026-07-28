import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { AdministrativeActionLogEntry } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; azioni: AdministrativeActionLogEntry[] }
  | { status: "error" };

/**
 * GET /api/v1/amministrazione-utenti/cronologia (getAdministrativeActionLog,
 * RF4.8) — solo GESTORE_UTENTI. Nessun filtro server inviato: la Cronologia
 * (mockup 48) filtra i tab lato client, e la Scheda Utente (mockup 40)
 * filtra per utenteTargetId lato client — nessun parametro query
 * dell'endpoint accetta un id utente diretto. refetch esposto: la Scheda
 * Utente lo richiama dopo sospendi/riattiva/esporta, altrimenti la nuova
 * voce di log non comparirebbe finché la pagina non viene ricaricata.
 */
export function useAdministrativeActionLog(): State & { refetch: () => void } {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/amministrazione-utenti/cronologia")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", azioni: await response.json() });
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
