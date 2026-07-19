import { toast } from "@/lib/toast/toast";
import { apiFetch } from "@/lib/http/client";

interface ErrorBody {
  messages?: string[];
}

export interface UpdateProfileInput {
  nome: string;
  cognome: string;
  fotoProfilo: string | null;
  biografia: string | null;
}

/** PUT /api/v1/utenti/me (RF1.6, UC_4) — nome/cognome/biografia editabili dall'utente; fotoProfilo qui è sempre il valore già esistente (nessuna UI di upload, cfr. Avatar). */
export async function updateProfile(input: UpdateProfileInput): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch("/api/v1/utenti/me", {
      method: "PUT",
      body: JSON.stringify(input),
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
    toast.error(body.messages?.[0] ?? "Non è stato possibile salvare le modifiche. Riprova.");
    return false;
  }

  toast.success("Profilo aggiornato con successo.");
  return true;
}
