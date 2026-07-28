import { toast } from "@/lib/toast/toast";
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

/**
 * POST /api/v1/amministrazione-utenti/richieste-cancellazione/{requestId}/elaborazione
 * (processAccountDeletion, RF4.6, UC_25). Nessun body. Può fallire con 409
 * (ContenutiInSospesoException, UC_25.1) se l'utente ha articoli in attesa di
 * approvazione: il messaggio del backend è già specifico, non serve un
 * fallback generico per questo caso.
 */
export async function processAccountDeletion(requestId: number): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/amministrazione-utenti/richieste-cancellazione/${requestId}/elaborazione`, {
      method: "POST",
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile elaborare la cancellazione. Riprova."));
    return false;
  }

  toast.success("Cancellazione elaborata con successo.");
  return true;
}
