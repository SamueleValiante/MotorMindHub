import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";

export interface PublicProfile {
  id: number;
  nome: string;
  cognome: string;
  fotoProfilo: string | null;
  biografia: string | null;
}

type State =
  | { status: "loading" }
  | { status: "found"; profile: PublicProfile }
  | { status: "not-found" };

/** GET /api/v1/utenti/{userId}/profilo-pubblico — endpoint pubblico (permitAll in SecurityConfig, RF1.9), niente token da allegare. */
export function usePublicProfile(userId: number | null): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (userId === null) {
      return;
    }

    let cancelled = false;

    apiFetch(`/api/v1/utenti/${userId}/profilo-pubblico`, { skipAuth: true })
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setState({ status: "found", profile: await response.json() });
        } else {
          setState({ status: "not-found" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "not-found" });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // userId === null (es. segmento non numerico nell'URL) è un caso
  // derivabile subito dagli argomenti, non richiede un giro di effect.
  return userId === null ? { status: "not-found" } : state;
}
