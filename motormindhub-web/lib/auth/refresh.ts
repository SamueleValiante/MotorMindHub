import { useAuthStore } from "./store";

let inFlight: Promise<string | null> | null = null;

// Assorbe chiamate ravvicinate nel tempo a una sessione appena stabilita
// (da login diretto o da un refresh riuscito, cfr. sessionEstablishedAt in
// store.ts) — osservato in dev: AuthProvider può rimontare una seconda
// volta a poca distanza dalla prima (Turbopack ricompila on-demand una
// route mai visitata in questa sessione, cfr. nota in playwright.config.ts).
// Ogni refresh RUOTA il token lato backend (CLAUDE.md); se questa seconda
// chiamata resta in-flight quando una navigazione la abbandona, il nuovo
// cookie non viene mai applicato lato client ma il backend ha già ruotato —
// il refresh successivo arriva con un token ormai riutilizzato e la reuse
// detection revoca l'intera famiglia, disconnettendo l'utente subito dopo
// un login riuscito. Non è specifico di un ruolo: qualunque pagina con un
// mount abbastanza rapido da vincere questa corsa la espone.
const RECENT_SESSION_WINDOW_MS = 5000;

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
  const { status, accessToken, sessionEstablishedAt } = useAuthStore.getState();
  if (
    status === "authenticated" &&
    accessToken &&
    sessionEstablishedAt !== null &&
    Date.now() - sessionEstablishedAt < RECENT_SESSION_WINDOW_MS
  ) {
    return Promise.resolve(accessToken);
  }

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

/** Solo per i test: azzera lo stato di modulo tra un test e l'altro (inFlight altrimenti persiste tra file/describe diversi). */
export function __resetRefreshStateForTests(): void {
  inFlight = null;
}
