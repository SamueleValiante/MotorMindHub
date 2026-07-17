"use client";

import { useEffect } from "react";
import { ensureFreshAccessToken } from "./refresh";

/**
 * Monta il bootstrap della sessione una sola volta, in cima all'albero
 * (root layout): prova un refresh silenzioso contro il cookie httpOnly
 * per capire se c'è una sessione valida e, se sì, con quale ruolo.
 * Finché non risolve, useAuthStore().status resta "loading" e le guardie
 * dei gruppi protetti mostrano uno stato di attesa invece di reindirizzare.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void ensureFreshAccessToken();
  }, []);

  return children;
}
