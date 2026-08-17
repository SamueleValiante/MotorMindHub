import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { IntervalloGiorni } from "@/components/charts/DateRangeSelector";
import type { PuntoAndamentoLetture } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; punti: PuntoAndamentoLetture[] }
  | { status: "error" };

interface Result {
  status: "loading" | "ready" | "error";
  punti: PuntoAndamentoLetture[];
  /** true quando un refetch (cambio di `giorni`) è in corso ma c'è già una risposta precedente da mostrare. */
  isRefetching: boolean;
}

/**
 * GET /api/v1/autori/statistiche-autori/andamento-letture?giorni=N (RF3.1) — solo
 * MANAGER_AUTORI. Array nudo di PuntoAndamentoLettureDTO ({data, numeroLetture}),
 * zero-fill/clamp lato server, stesso pattern di useAndamentoPubblicazioni.
 */
export function useAndamentoLetture(giorni: IntervalloGiorni): Result {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/v1/autori/statistiche-autori/andamento-letture?giorni=${giorni}`)
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", punti: await response.json() });
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
  }, [giorni]);

  // Cfr. commento in useAndamentoVisite.ts: stesso pattern "tieni il fotogramma" durante un refetch.
  const [ultimiPunti, setUltimiPunti] = useState<PuntoAndamentoLetture[]>([]);
  if (state.status === "ready" && state.punti !== ultimiPunti) {
    setUltimiPunti(state.punti);
  }

  return {
    status: state.status,
    punti: state.status === "ready" ? state.punti : ultimiPunti,
    isRefetching: state.status === "loading" && ultimiPunti.length > 0,
  };
}
