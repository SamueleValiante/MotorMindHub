import { useAuthStore } from "./store";
import { toast } from "@/lib/toast/toast";
import type { Ruolo } from "./jwt";

interface LoginResult {
  ok: boolean;
  ruolo?: Ruolo;
  errorCode?: string;
}

interface LoginErrorBody {
  messages?: string[];
  errorCode?: string;
}

/**
 * POST /api/auth/login (proxy del punto 2): su successo popola lo store
 * auth e risolve col ruolo appena decodificato dal JWT, per permettere il
 * redirect per ruolo alla pagina di login. Su errore mostra direttamente
 * il messaggio del backend (RAD UC_2.1-2.3: credenziali errate / account
 * non verificato / account bloccato hanno testi distinti, cfr.
 * GlobalExceptionHandler in motormindhub-api) — nessuna mappa di
 * messaggi duplicata lato client, l'errorCode resta disponibile per
 * un'eventuale logica di branching futura (es. link "reinvia verifica").
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return { ok: false };
  }

  if (!response.ok) {
    let body: LoginErrorBody = {};
    try {
      body = await response.json();
    } catch {
      // corpo non JSON: si ricade sul messaggio generico sotto
    }
    toast.error(body.messages?.[0] ?? "Non è stato possibile accedere. Riprova.");
    return { ok: false, errorCode: body.errorCode };
  }

  const data: { accessToken: string } = await response.json();
  useAuthStore.getState().setSession(data.accessToken);

  const ruolo = useAuthStore.getState().ruolo;
  return { ok: true, ruolo: ruolo ?? undefined };
}
