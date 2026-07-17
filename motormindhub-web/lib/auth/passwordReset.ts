import { toast } from "@/lib/toast/toast";
import { apiFetch } from "@/lib/http/client";

interface ErrorBody {
  messages?: string[];
}

/**
 * POST /api/v1/utenti/password/recupero: ritorna true per qualunque
 * indirizzo email sintatticamente valido, esista o meno un account attivo
 * associato — il backend garantisce la stessa risposta (status incluso,
 * verificato dal vivo) in entrambi i casi (RAD UC_3.1, non-disclosure).
 * Non c'è quindi nulla da distinguere qui: un false indica solo un errore
 * reale (rete, validazione formato email).
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch("/api/v1/utenti/password/recupero", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email }),
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    let body: ErrorBody = {};
    try {
      body = await response.json();
    } catch {
      // corpo non JSON: si ricade sul messaggio generico sotto
    }
    toast.error(body.messages?.[0] ?? "Non è stato possibile completare la richiesta. Riprova.");
    return false;
  }

  return true;
}

export async function resetPassword(token: string, password: string): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(
      `/api/v1/utenti/password/reset?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ password }),
      }
    );
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    let body: ErrorBody = {};
    try {
      body = await response.json();
    } catch {
      // corpo non JSON: si ricade sul messaggio generico sotto
    }
    toast.error(body.messages?.[0] ?? "Non è stato possibile reimpostare la password. Riprova.");
    return false;
  }

  return true;
}
