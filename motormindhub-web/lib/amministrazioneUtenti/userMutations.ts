import { toast } from "@/lib/toast/toast";
import { apiFetch } from "@/lib/http/client";
import type { SuspensionInput } from "./types";

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

/** POST /api/v1/amministrazione-utenti/utenti/{userId}/sospensione (suspendAccount, RF4.3, UC_23). */
export async function suspendAccount(userId: number, dto: SuspensionInput): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/amministrazione-utenti/utenti/${userId}/sospensione`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile sospendere l'account. Riprova."));
    return false;
  }

  toast.success("Account sospeso con successo.");
  return true;
}

/** POST /api/v1/amministrazione-utenti/utenti/{userId}/riattivazione (reactivateAccount, RF4.4, UC_24). Nessun body. */
export async function reactivateAccount(userId: number): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/amministrazione-utenti/utenti/${userId}/riattivazione`, {
      method: "POST",
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile riattivare l'account. Riprova."));
    return false;
  }

  toast.success("Account riattivato con successo.");
  return true;
}

/**
 * POST /api/v1/amministrazione-utenti/utenti/{userId}/esportazione-dati
 * (exportUserDataAssisted, RF4.7, UC_27). Nessun body: la verifica
 * dell'identità del richiedente (UC_27 passo 1) è un controllo manuale del
 * Gestore Utenti fuori sistema, precedente al click — non c'è un campo da
 * inviare (verificato nel service, nessuna pre-condizione OCL lo richiede).
 */
export async function exportUserDataAssisted(userId: number): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/amministrazione-utenti/utenti/${userId}/esportazione-dati`, {
      method: "POST",
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile avviare l'esportazione. Riprova."));
    return false;
  }

  return true;
}
