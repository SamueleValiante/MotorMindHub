import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { IntervalloGiorni } from "@/components/charts/DateRangeSelector";
import type { PuntoAndamentoVisite } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; punti: PuntoAndamentoVisite[] }
  | { status: "error" };

interface Result {
  status: "loading" | "ready" | "error";
  punti: PuntoAndamentoVisite[];
  /** true quando un refetch (cambio di `giorni`) è in corso ma c'è già una risposta precedente da mostrare. */
  isRefetching: boolean;
}

/**
 * GET /api/v1/amministrazione-utenti/statistiche-visite/andamento?giorni=N
 * (RF3.1, UC_28) — solo GESTORE_UTENTI. Risposta confermata su Swagger:
 * array nudo di PuntoAndamentoVisiteDTO ({data, guest, iscritto}), zero-fill
 * e clamp [1,90] già lato server — nessuna elaborazione aggiuntiva qui.
 */
export function useAndamentoVisite(giorni: IntervalloGiorni): Result {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/v1/amministrazione-utenti/statistiche-visite/andamento?giorni=${giorni}`)
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

  // "Il refetch tiene il fotogramma" (skill dataviz, interaction.md): tiene
  // l'ultima risposta valida anche mentre `giorni` cambia e riparte un
  // fetch, così il grafico non sparisce dietro un placeholder. setState
  // durante il render (non in un effect) è il modo corretto di "adattare lo
  // stato quando cambia un prop" — https://react.dev/learn/you-might-not-need-an-effect.
  const [ultimiPunti, setUltimiPunti] = useState<PuntoAndamentoVisite[]>([]);
  if (state.status === "ready" && state.punti !== ultimiPunti) {
    setUltimiPunti(state.punti);
  }

  return {
    status: state.status,
    punti: state.status === "ready" ? state.punti : ultimiPunti,
    isRefetching: state.status === "loading" && ultimiPunti.length > 0,
  };
}
