import { toast } from "@/lib/toast/toast";
import { apiFetch } from "@/lib/http/client";
import type { StatoSegnalazione, SuspensionInput } from "./types";

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

/** POST /api/v1/amministrazione-utenti/segnalazioni/{reportId}/risoluzione (resolveReport, RF4.5, UC_26). */
export async function resolveReport(reportId: number, nuovoStato: StatoSegnalazione): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/amministrazione-utenti/segnalazioni/${reportId}/risoluzione`, {
      method: "POST",
      body: JSON.stringify({ nuovoStato }),
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile aggiornare la segnalazione. Riprova."));
    return false;
  }

  toast.success("Segnalazione aggiornata con successo.");
  return true;
}

export type EscalateResult =
  | { outcome: "success" }
  | { outcome: "suspend-failed"; message: string }
  | { outcome: "resolve-failed" };

/**
 * "Scala a Sospensione" (UC_26.2, mockup 45): non è un singolo endpoint, ma
 * un'orchestrazione di due chiamate distinte, come da commento esplicito su
 * GestioneAmministrazioneUtenti.resolveReport — suspendAccount PRIMA,
 * resolveReport(ARCHIVIATA) DOPO. Se la seconda fallisce, l'account resta
 * comunque sospeso: un retry dell'intero flusso richiamerebbe suspendAccount
 * su un utente già SOSPESO, fallendo con "Solo un account attivo può essere
 * sospeso" (vedi StatoAccountNonValidoException). Per questo il chiamante
 * distingue "resolve-failed" da un fallimento generico e NON deve mostrare lo
 * stesso messaggio di successo pieno: l'utente va avvisato che la sospensione
 * è avvenuta ma la segnalazione va chiusa a mano dalla coda.
 */
export async function escalateReportToSuspension(
  reportId: number,
  segnalatoId: number,
  dto: SuspensionInput
): Promise<EscalateResult> {
  let suspendResponse: Response;
  try {
    suspendResponse = await apiFetch(`/api/v1/amministrazione-utenti/utenti/${segnalatoId}/sospensione`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  } catch {
    return { outcome: "suspend-failed", message: "Impossibile contattare il server. Riprova più tardi." };
  }

  if (!suspendResponse.ok) {
    return {
      outcome: "suspend-failed",
      message: await extractErrorMessage(suspendResponse, "Non è stato possibile sospendere l'account. Riprova."),
    };
  }

  try {
    const resolveResponse = await apiFetch(
      `/api/v1/amministrazione-utenti/segnalazioni/${reportId}/risoluzione`,
      { method: "POST", body: JSON.stringify({ nuovoStato: "ARCHIVIATA" }) }
    );
    if (!resolveResponse.ok) {
      return { outcome: "resolve-failed" };
    }
  } catch {
    return { outcome: "resolve-failed" };
  }

  return { outcome: "success" };
}
