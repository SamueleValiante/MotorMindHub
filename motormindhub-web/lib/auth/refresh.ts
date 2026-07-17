import { useAuthStore } from "./store";

let inFlight: Promise<string | null> | null = null;

/**
 * Rinnova l'access token chiamando il proxy /api/auth/refresh (che legge il
 * refresh token dal cookie httpOnly). Deduplica le chiamate concorrenti in
 * un'unica richiesta in-flight: sia il bootstrap iniziale (AuthProvider) sia
 * l'interceptor 401 di apiFetch la invocano, e più refresh paralleli sullo
 * stesso refresh token rotante rischierebbero di attivare la reuse detection
 * del backend (rotazione con revoca famiglia, cfr. CLAUDE.md).
 *
 * Risolve con un access token fresco, oppure null se la sessione non è
 * rinnovabile (nessun cookie, refresh scaduto, famiglia revocata): in quel
 * caso lo stato viene già riportato ad "anonymous", senza retry.
 */
export function ensureFreshAccessToken(): Promise<string | null> {
  if (!inFlight) {
    inFlight = fetch("/api/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          useAuthStore.getState().clearSession();
          return null;
        }
        const data: { accessToken: string } = await res.json();
        useAuthStore.getState().setSession(data.accessToken);
        return data.accessToken;
      })
      .catch(() => {
        useAuthStore.getState().clearSession();
        return null;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
