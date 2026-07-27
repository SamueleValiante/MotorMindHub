import { create } from "zustand";
import { decodeAccessToken, type Ruolo } from "./jwt";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  uid: number | null;
  ruolo: Ruolo | null;
  /**
   * Decodificato dal claim "sub" del JWT, non da GET /utenti/me: quell'endpoint
   * esclude deliberatamente GESTORE_UTENTI dai self-service (RAD 3.2.4,
   * SelfServiceAuthorizationIntegrationTest) e non è quindi utilizzabile da
   * GestoreSidebar per mostrare l'utente corrente.
   */
  email: string | null;
  /**
   * Timestamp (Date.now()) dell'ultima volta che una sessione valida è
   * stata stabilita, da login diretto o da un refresh riuscito — letto da
   * ensureFreshAccessToken (refresh.ts) per evitare un refresh ridondante
   * a pochissima distanza da uno già riuscito. Vedi il commento lì per il
   * perché: un refresh rimasto in-flight abbandonato da una navigazione
   * rapida rischia la reuse detection del backend sul successivo.
   */
  sessionEstablishedAt: number | null;
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
  email: null,
  sessionEstablishedAt: null,
  setSession: (accessToken) => {
    const payload = decodeAccessToken(accessToken);
    set({
      status: "authenticated",
      accessToken,
      uid: payload.uid,
      ruolo: payload.ruolo,
      email: payload.sub,
      sessionEstablishedAt: Date.now(),
    });
  },
  clearSession: () =>
    set({
      status: "anonymous",
      accessToken: null,
      uid: null,
      ruolo: null,
      email: null,
      sessionEstablishedAt: null,
    }),
}));
