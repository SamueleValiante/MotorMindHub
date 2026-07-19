import { toast } from "@/lib/toast/toast";
import { apiFetch } from "@/lib/http/client";

interface ErrorBody {
  messages?: string[];
}

/**
 * POST /api/v1/utenti/segnalazioni: RF1.9/UC_26. Il backend blocca
 * l'auto-segnalazione (reporterId === segnalatoId) con un 400 dedicato —
 * verificato nel codice (GestioneUtenti.reportUser), non assunto.
 */
export async function reportUser(segnalatoId: number, motivazione: string): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch("/api/v1/utenti/segnalazioni", {
      method: "POST",
      body: JSON.stringify({ segnalatoId, motivazione }),
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
    toast.error(body.messages?.[0] ?? "Non è stato possibile inviare la segnalazione. Riprova.");
    return false;
  }

  const data: { message?: string } = await response.json().catch(() => ({}));
  toast.success(data.message ?? "Segnalazione inviata.");
  return true;
}
