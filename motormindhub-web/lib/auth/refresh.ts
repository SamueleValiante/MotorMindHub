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

// Assorbe un singolo blip transitorio (backend irraggiungibile, 5xx: cfr.
// commento sotto) senza far percepire all'utente un logout. Non è pensato
// per un'interruzione prolungata del backend: in quel caso, dopo i
// tentativi, si rinuncia senza forzare "anonymous" (vedi sotto).
const TRANSIENT_FAILURE_RETRIES = 1;
const TRANSIENT_FAILURE_RETRY_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function performRefresh(attempt = 0): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch("/api/auth/refresh", { method: "POST" });
  } catch {
    if (attempt < TRANSIENT_FAILURE_RETRIES) {
      await sleep(TRANSIENT_FAILURE_RETRY_DELAY_MS);
      return performRefresh(attempt + 1);
    }
    // Errore di rete, non un rifiuto esplicito del backend: non è la stessa
    // cosa di "sessione non rinnovabile", quindi NON tocca lo stato — vedi
    // il commento su ensureFreshAccessToken.
    return null;
  }

  if (res.status === 401) {
    // Unico caso in cui il backend ha accertato che il token non è più
    // valido (scaduto, revocato, riutilizzo rilevato): qui, e solo qui, lo
    // stato va riportato ad "anonymous".
    useAuthStore.getState().clearSession();
    return null;
  }

  if (!res.ok) {
    if (attempt < TRANSIENT_FAILURE_RETRIES) {
      await sleep(TRANSIENT_FAILURE_RETRY_DELAY_MS);
      return performRefresh(attempt + 1);
    }
    return null;
  }

  const data: { accessToken: string } = await res.json();
  useAuthStore.getState().setSession(data.accessToken);
  return data.accessToken;
}

/**
 * Rinnova l'access token chiamando il proxy /api/auth/refresh (che legge il
 * refresh token dal cookie httpOnly). Deduplica le chiamate concorrenti in
 * un'unica richiesta in-flight: sia il bootstrap iniziale (AuthProvider) sia
 * l'interceptor 401 di apiFetch la invocano, e più refresh paralleli sullo
 * stesso refresh token rotante rischierebbero di attivare la reuse detection
 * del backend (rotazione con revoca famiglia, cfr. CLAUDE.md).
 *
 * Risolve con un access token fresco, oppure null se il refresh non è
 * riuscito. Due casi molto diversi dietro quel null: se il proxy ha
 * risposto 401 (token scaduto, revocato, o riutilizzo rilevato), la
 * sessione NON è rinnovabile e lo stato è già stato riportato ad
 * "anonymous". Se invece il fallimento è un errore di rete o un 5xx
 * transitorio (backend momentaneamente irraggiungibile: osservato dal vivo
 * in produzione), il token nel cookie httpOnly potrebbe essere ancora
 * perfettamente valido — lo stato NON viene toccato, per non sloggare un
 * utente che non ha mai perso la sessione lato server (bug osservato: un
 * reload durante un blip trasformava un "torna alla home" della sidebar in
 * un "torna alla home pubblica", perché nel frattempo si era finiti su
 * /login). Il chiamante che aveva bisogno del token vede solo `null` e si
 * comporta come già faceva per una sessione non rinnovabile (apiFetch
 * propaga la risposta 401 originale as-is, RoleGuard resta in "loading").
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
    inFlight = performRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/** Solo per i test: azzera lo stato di modulo tra un test e l'altro (inFlight altrimenti persiste tra file/describe diversi). */
export function __resetRefreshStateForTests(): void {
  inFlight = null;
}
