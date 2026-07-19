import { toast } from "@/lib/toast/toast";
import { apiFetch } from "@/lib/http/client";

interface ErrorBody {
  messages?: string[];
}

/**
 * POST /api/v1/utenti/me/cancellazione: verificato nel codice
 * (GestioneUtenti.requestAccountDeletion) che questo NON elimina né
 * anonimizza nulla subito — crea solo una RichiestaCancellazione in coda
 * per il Gestore Utenti (RF1.10/UC_25). Lo stato dell'account resta ATTIVO
 * finché la richiesta non viene lavorata, poi diventa CANCELLATO
 * direttamente (StatoUtente non ha più un valore intermedio dedicato,
 * rimosso dal backend). La sessione dell'utente non viene invalidata da
 * questa chiamata: niente logout automatico qui, non rifletterebbe la
 * realtà (l'account è ancora pienamente utilizzabile).
 */
export async function requestAccountDeletion(): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch("/api/v1/utenti/me/cancellazione", {
      method: "POST",
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
    toast.error(body.messages?.[0] ?? "Non è stato possibile inviare la richiesta. Riprova.");
    return false;
  }

  return true;
}
