import { toast } from "@/lib/toast/toast";
import { apiFetch } from "@/lib/http/client";

interface ErrorBody {
  messages?: string[];
}

/**
 * POST /api/v1/utenti/me/esportazione-dati: il backend invia i dati come
 * allegato JSON via email (verificato nel codice — GestioneNotifiche.
 * onDataExportReady — e dal vivo su Mailpit), non un link di download né
 * un file scaricabile subito. La UI deve riflettere questo: nessun
 * download diretto, solo la conferma che l'email sta per arrivare.
 */
export async function requestDataExport(): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch("/api/v1/utenti/me/esportazione-dati", {
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
    toast.error(body.messages?.[0] ?? "Non è stato possibile richiedere l'esportazione. Riprova.");
    return false;
  }

  const data: { message?: string } = await response.json().catch(() => ({}));
  toast.success(data.message ?? "Riceverai a breve un'email con il link per scaricare i tuoi dati.");
  return true;
}
