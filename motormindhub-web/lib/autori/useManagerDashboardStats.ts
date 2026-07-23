import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { ManagerDashboardStats } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; stats: ManagerDashboardStats }
  | { status: "error" };

/**
 * GET /api/v1/autori/dashboard (getManagerDashboardStats, RF3.1) — solo
 * MANAGER_AUTORI. Il grafico "Andamento visite" del mockup 29 non è nel
 * DTO (nessun tracciamento visualizzazioni per data nel modello) e non è
 * quindi renderizzato da chi consuma questo hook.
 */
export function useManagerDashboardStats(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/autori/dashboard")
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
