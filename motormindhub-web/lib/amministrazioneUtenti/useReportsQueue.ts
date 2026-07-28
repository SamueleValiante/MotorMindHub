import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { ReportQueueItem } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; segnalazioni: ReportQueueItem[] }
  | { status: "error" };

/**
 * GET /api/v1/amministrazione-utenti/segnalazioni (getReportsQueue, RF4.5/RF4.6,
 * UC_26) — solo GESTORE_UTENTI. Nessun filtro server-side per stato: restituisce
 * sempre l'intera coda, i tab Aperte/In gestione/Archiviate (mockup 44) filtrano
 * lato client. Riusata anche dal dettaglio segnalazione (mockup 45): non esiste
 * un GET singolo per segnalazione, ma ReportQueueItemDTO porta già tutti i campi
 * che il dettaglio mostra (verificato sul DTO, non assunto).
 */
export function useReportsQueue(): State & { refetch: () => void } {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/amministrazione-utenti/segnalazioni")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", segnalazioni: await response.json() });
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
