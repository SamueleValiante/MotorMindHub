import { apiFetch } from "@/lib/http/client";

interface ErrorBody {
  messages?: string[];
}

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body: ErrorBody = await response.json();
    return body.messages?.[0] ?? fallback;
  } catch {
    return fallback;
  }
}

export type InviteResponseResult = { ok: true } | { ok: false; message: string };

/**
 * POST /api/v1/autori/inviti/{token}/accetta (acceptInvite, UC_9) — pubblico
 * (permitAll, SecurityConfig), il chiamante non ha ancora un account:
 * skipAuth true come reimposta-password (lib/auth/passwordReset.ts), stesso
 * client http, nessun client separato.
 */
export async function acceptInvite(token: string, password: string): Promise<InviteResponseResult> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/autori/inviti/${encodeURIComponent(token)}/accetta`, {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ password }),
    });
  } catch {
    return { ok: false, message: "Impossibile contattare il server. Riprova più tardi." };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: await extractErrorMessage(
        response,
        "L'invito non è valido, è scaduto o è già stato usato."
      ),
    };
  }

  return { ok: true };
}

/** POST /api/v1/autori/inviti/{token}/rifiuta (declineInvite, UC_10) — pubblico, stesso trattamento. */
export async function declineInvite(token: string): Promise<InviteResponseResult> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/autori/inviti/${encodeURIComponent(token)}/rifiuta`, {
      method: "POST",
      skipAuth: true,
    });
  } catch {
    return { ok: false, message: "Impossibile contattare il server. Riprova più tardi." };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: await extractErrorMessage(
        response,
        "L'invito non è valido o è già stato processato."
      ),
    };
  }

  return { ok: true };
}
