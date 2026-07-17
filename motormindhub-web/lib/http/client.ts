import { useAuthStore } from "@/lib/auth/store";
import { ensureFreshAccessToken } from "@/lib/auth/refresh";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export interface ApiFetchOptions extends RequestInit {
  /** Per gli endpoint pubblici: niente header Authorization, niente retry sul 401. */
  skipAuth?: boolean;
}

/**
 * Wrapper fetch verso il backend Spring Boot (chiamata diretta dal browser,
 * CORS già configurato lato backend). Allega l'access token in memoria e,
 * su 401 (non autenticato: token assente, scaduto o non valido), tenta un
 * solo rinnovo tramite ensureFreshAccessToken() prima di ripetere la
 * richiesta una volta sola: se anche il retry fallisce (o la sessione non
 * è rinnovabile), propaga la risposta così com'è, senza loop.
 *
 * Un 403 (autenticato ma ruolo insufficiente, RNF9.5) NON attiva un
 * refresh: un nuovo access token avrebbe lo stesso ruolo, quindi non
 * risolverebbe nulla. La Response viene restituita as-is al chiamante, che
 * può distinguerla da un problema di sessione (es. per mostrare un
 * messaggio "non hai i permessi per questa sezione" invece di forzare il
 * logout) — l'informazione dello status code non va persa qui.
 */
export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { skipAuth, headers, body, ...rest } = options;

  const buildHeaders = (token: string | null): HeadersInit => ({
    ...(body && !(body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...headers,
    ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
  });

  const send = (token: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      body,
      headers: buildHeaders(token),
    });

  const accessToken = useAuthStore.getState().accessToken;
  const response = await send(accessToken);

  if (response.status !== 401 || skipAuth) {
    return response;
  }

  const freshToken = await ensureFreshAccessToken();
  if (!freshToken) {
    return response;
  }

  return send(freshToken);
}
