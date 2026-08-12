import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { VisiteStatistiche } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; stats: VisiteStatistiche }
  | { status: "error" };

/** GET /api/v1/amministrazione-utenti/statistiche-visite (RF3.1, UC_28) — solo GESTORE_UTENTI. */
export function useVisiteStatistiche(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/amministrazione-utenti/statistiche-visite")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", stats: await response.json() });
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
