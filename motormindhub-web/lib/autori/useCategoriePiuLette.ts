import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { CategoriaPiuLetta } from "./types";

type State =
  | { status: "loading" }
  | { status: "ready"; categorie: CategoriaPiuLetta[] }
  | { status: "error" };

/**
 * GET /api/v1/autori/statistiche-autori/categorie-piu-lette (RF3.1) — solo MANAGER_AUTORI.
 * Array nudo di CategoriaPiuLettaDTO, già ordinato desc e limitato alle top 10 lato server
 * (GestioneAutori.getCategoriePiuLette) — nessun sort/limit da rifare qui.
 */
export function useCategoriePiuLette(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/autori/statistiche-autori/categorie-piu-lette")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "ready", categorie: await response.json() });
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
