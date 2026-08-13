import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureFreshAccessToken, __resetRefreshStateForTests } from "./refresh";
import { useAuthStore } from "./store";
import { apiFetch } from "@/lib/http/client";

function buildAccessToken(ruolo: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
    "base64url"
  );
  const payload = Buffer.from(
    JSON.stringify({
      sub: "test@example.com",
      uid: 1,
      ruolo,
      iat: 0,
      exp: 9999999999,
    })
  ).toString("base64url");
  return `${header}.${payload}.sig`;
}

describe("ensureFreshAccessToken", () => {
  beforeEach(() => {
    __resetRefreshStateForTests();
    useAuthStore.setState({
      status: "loading",
      accessToken: null,
      uid: null,
      ruolo: null,
      sessionEstablishedAt: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("deduplica chiamate concorrenti in un'unica richiesta di rete", async () => {
    // Regressione: più consumer (AuthProvider al mount, apiFetch su 401 da
    // richieste parallele) possono invocare ensureFreshAccessToken() nello
    // stesso istante. Senza dedup, ognuno spedirebbe il refresh token
    // corrente al backend: con la rotation-with-reuse-detection del backend
    // (cfr. CLAUDE.md), la seconda richiesta arriverebbe con un token già
    // invalidato dalla prima, facendo scattare la revoca dell'intera
    // famiglia e disconnettendo l'utente.
    let callCount = 0;
    const freshToken = buildAccessToken("ISCRITTO");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        callCount += 1;
        // Simula una latenza di rete non nulla: se il dedup non
        // funzionasse, una seconda chiamata partirebbe prima che questa
        // si risolva, ed entrambe finirebbero nel log delle richieste.
        await new Promise((resolve) => setTimeout(resolve, 20));
        return new Response(JSON.stringify({ accessToken: freshToken }), {
          status: 200,
        });
      })
    );

    const results = await Promise.all([
      ensureFreshAccessToken(),
      ensureFreshAccessToken(),
      ensureFreshAccessToken(),
      ensureFreshAccessToken(),
    ]);

    expect(callCount).toBe(1);
    expect(results).toEqual([freshToken, freshToken, freshToken, freshToken]);
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().ruolo).toBe("ISCRITTO");
  });

  it("propaga a tutti i chiamanti concorrenti un refresh fallito (sessione non rinnovabile)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: "Sessione non valida." }), {
            status: 401,
          })
      )
    );

    const results = await Promise.all([
      ensureFreshAccessToken(),
      ensureFreshAccessToken(),
      ensureFreshAccessToken(),
    ]);

    expect(results).toEqual([null, null, null]);
    expect(useAuthStore.getState().status).toBe("anonymous");
  });

  it("un 503 transitorio (backend momentaneamente giù) NON forza \"anonymous\": il refresh token nel cookie potrebbe essere ancora valido", async () => {
    // Regressione: reload su una pagina protetta durante un blip
    // infrastrutturale (osservato dal vivo in produzione) non deve
    // sloggare un utente la cui sessione backend è ancora perfettamente
    // valida - a differenza di un 401 esplicito, un 503 non è un rifiuto
    // accertato del token.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Service Unavailable", { status: 503 }))
    );

    const result = await ensureFreshAccessToken();

    expect(result).toBeNull();
    expect(useAuthStore.getState().status).toBe("loading");
  });

  it("un errore di rete (fetch che rigetta) NON forza \"anonymous\", stessa ragione del 503", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      })
    );

    const result = await ensureFreshAccessToken();

    expect(result).toBeNull();
    expect(useAuthStore.getState().status).toBe("loading");
  });

  it("un 503 seguito da un 200 al retry riesce, senza mai passare da \"anonymous\"", async () => {
    let callCount = 0;
    const freshToken = buildAccessToken("GESTORE_UTENTI");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        callCount += 1;
        if (callCount === 1) {
          return new Response("Service Unavailable", { status: 503 });
        }
        return new Response(JSON.stringify({ accessToken: freshToken }), {
          status: 200,
        });
      })
    );

    const result = await ensureFreshAccessToken();

    expect(callCount).toBe(2);
    expect(result).toBe(freshToken);
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("un secondo refresh ravvicinato nel tempo (non concorrente) riusa il token appena ottenuto, senza rete", async () => {
    // Regressione: AuthProvider può rimontare una seconda volta a poca
    // distanza dalla prima (osservato in dev, cfr. commento in refresh.ts) —
    // senza questa cache breve, la seconda chiamata ruoterebbe di nuovo il
    // refresh token; se una navigazione la abbandona prima che il nuovo
    // cookie venga applicato, il refresh successivo arriva con un token già
    // ruotato e la reuse detection del backend revoca l'intera famiglia.
    let callCount = 0;
    const freshToken = buildAccessToken("ISCRITTO");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        callCount += 1;
        return new Response(JSON.stringify({ accessToken: freshToken }), {
          status: 200,
        });
      })
    );

    await ensureFreshAccessToken();
    await ensureFreshAccessToken();

    expect(callCount).toBe(1);
  });

  it("avvia una nuova richiesta di rete una volta scaduta la finestra di cache breve", async () => {
    vi.useFakeTimers();
    let callCount = 0;
    const freshToken = buildAccessToken("ISCRITTO");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        callCount += 1;
        return new Response(JSON.stringify({ accessToken: freshToken }), {
          status: 200,
        });
      })
    );

    await ensureFreshAccessToken();
    await vi.advanceTimersByTimeAsync(6000);
    await ensureFreshAccessToken();

    expect(callCount).toBe(2);
    vi.useRealTimers();
  });
});

describe("apiFetch", () => {
  beforeEach(() => {
    __resetRefreshStateForTests();
    useAuthStore.setState({
      status: "authenticated",
      accessToken: buildAccessToken("ISCRITTO"),
      uid: 1,
      ruolo: "ISCRITTO",
      // null, non "appena stabilita": questi test verificano il retry su
      // 401/403 di apiFetch, non la cache breve di ensureFreshAccessToken.
      sessionEstablishedAt: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("su 401 (non autenticato) tenta un refresh e ripete la richiesta originale", async () => {
    const freshToken = buildAccessToken("ISCRITTO");
    let refreshCalls = 0;
    let backendCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("/api/auth/refresh")) {
          refreshCalls += 1;
          return new Response(JSON.stringify({ accessToken: freshToken }), {
            status: 200,
          });
        }
        backendCalls += 1;
        return backendCalls === 1
          ? new Response(null, { status: 401 })
          : new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
    );

    const response = await apiFetch("/api/v1/utenti/me");

    expect(refreshCalls).toBe(1);
    expect(backendCalls).toBe(2);
    expect(response.status).toBe(200);
  });

  it("su 403 (ruolo insufficiente) NON tenta alcun refresh: propaga la risposta as-is", async () => {
    let refreshCalls = 0;
    let backendCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("/api/auth/refresh")) {
          refreshCalls += 1;
          return new Response(
            JSON.stringify({ accessToken: buildAccessToken("ISCRITTO") }),
            { status: 200 }
          );
        }
        backendCalls += 1;
        // Un nuovo access token avrebbe lo stesso ruolo: un refresh qui non
        // risolverebbe nulla, quindi non deve nemmeno essere tentato.
        return new Response(JSON.stringify({ message: "Accesso negato" }), {
          status: 403,
        });
      })
    );

    const response = await apiFetch(
      "/api/v1/amministrazione-utenti/dashboard"
    );

    expect(refreshCalls).toBe(0);
    expect(backendCalls).toBe(1);
    expect(response.status).toBe(403);
  });
});
