import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { StatisticheLetture } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; stats: StatisticheLetture }
  | { status: "error" };

/** GET /api/v1/autori/statistiche-autori/letture (RF3.1) — solo MANAGER_AUTORI. */
export function useStatisticheLetture(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/autori/statistiche-autori/letture")
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
