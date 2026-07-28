import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { UserManagementDashboardStats } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; stats: UserManagementDashboardStats }
  | { status: "error" };

/**
 * GET /api/v1/amministrazione-utenti/dashboard (getUserManagementDashboard,
 * RF4.1) — solo GESTORE_UTENTI. Il delta "+N questa settimana" del mockup 38
 * non è nel DTO (nessun tracciamento registrazioni per data nel modello) e
 * non è quindi renderizzato da chi consuma questo hook — stesso trattamento
 * del grafico "andamento visite" in GestioneAutori.
 */
export function useUserManagementDashboard(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/amministrazione-utenti/dashboard")
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
