import { create } from "zustand";
import { decodeAccessToken, type Ruolo } from "./jwt";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  uid: number | null;
  ruolo: Ruolo | null;
  setSession: (accessToken: string) => void;
  clearSession: () => void;
}

/**
 * Store globale, solo client: l'access token vive esclusivamente in memoria
 * (mai in localStorage/cookie leggibile da JS) e viene ricostruito ad ogni
 * caricamento pagina tramite il bootstrap (AuthProvider -> /api/auth/refresh).
 * Non viene mai letto durante il render lato server, quindi il singleton di
 * modulo non introduce condivisione di stato tra utenti.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  accessToken: null,
  uid: null,
  ruolo: null,
  setSession: (accessToken) => {
    const payload = decodeAccessToken(accessToken);
    set({
      status: "authenticated",
      accessToken,
      uid: payload.uid,
      ruolo: payload.ruolo,
    });
  },
  clearSession: () =>
    set({ status: "anonymous", accessToken: null, uid: null, ruolo: null }),
}));
