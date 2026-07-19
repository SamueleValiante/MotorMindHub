"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { Ruolo } from "./jwt";

export interface CurrentUser {
  email: string;
  ruolo: Ruolo;
  stato: "NON_VERIFICATO" | "ATTIVO" | "SOSPESO" | "CANCELLATO";
  dataRegistrazione: string;
  nome: string;
  cognome: string;
  fotoProfilo: string | null;
  biografia: string | null;
}

/** GET /api/v1/utenti/me: da usare solo dentro pagine già protette da RoleGuard (l'access token è garantito presente a quel punto). */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/api/v1/utenti/me")
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setUser(await response.json());
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
