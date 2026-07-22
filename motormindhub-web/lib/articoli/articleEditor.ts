import { toast } from "@/lib/toast/toast";
import { apiFetch } from "@/lib/http/client";

interface ErrorBody {
  messages?: string[];
}

export interface ArticleDraftInput {
  titolo: string;
  testo: string;
  categoriaId: number | null;
  tag: string[];
  immagineCopertina: string | null;
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
 * POST /api/v1/articoli/bozze (createDraft, RF2.7, UC_16): a differenza degli
 * altri endpoint di scrittura qui non c'è ancora un id di percorso, la
 * risposta lo restituisce (DraftCreatedResponseDTO) proprio perché il
 * chiamante ne ha bisogno per continuare l'editing sulla stessa bozza.
 * Nessun toast di successo qui: il chiamante decide il messaggio giusto in
 * base a cosa succede subito dopo (resta sulla bozza vs. la invia subito in
 * approvazione).
 */
export async function createDraft(dto: ArticleDraftInput): Promise<number | null> {
  let response: Response;
  try {
    response = await apiFetch("/api/v1/articoli/bozze", { method: "POST", body: JSON.stringify(dto) });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return null;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile creare la bozza. Riprova."));
    return null;
  }

  const data: { id: number } = await response.json();
  return data.id;
}

/** PUT /api/v1/articoli/bozze/{draftId} (updateDraft, RF2.7, UC_17). */
export async function updateDraft(draftId: number, dto: ArticleDraftInput): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/articoli/bozze/${draftId}`, { method: "PUT", body: JSON.stringify(dto) });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile salvare la bozza. Riprova."));
    return false;
  }

  toast.success("Bozza salvata con successo.");
  return true;
}

/** POST /api/v1/articoli/bozze/{draftId}/pubblicazione (publishArticle, RF2.2, UC_15/17): BOZZA -> IN_ATTESA_APPROVAZIONE. */
export async function publishArticle(draftId: number): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/articoli/bozze/${draftId}/pubblicazione`, { method: "POST" });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile inviare l'articolo in approvazione. Riprova."));
    return false;
  }

  toast.success("Articolo inviato in approvazione.");
  return true;
}

/** PUT /api/v1/articoli/{articleId} (updatePublishedArticle, RF2.3, UC_20): richiede testo non vuoto, a differenza della bozza. */
export async function updatePublishedArticle(
  articleId: number,
  dto: Required<Pick<ArticleDraftInput, "titolo" | "testo" | "categoriaId">> & Pick<ArticleDraftInput, "tag" | "immagineCopertina">
): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/articoli/${articleId}`, { method: "PUT", body: JSON.stringify(dto) });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile aggiornare l'articolo. Riprova."));
    return false;
  }

  toast.success("Articolo aggiornato con successo.");
  return true;
}

/** POST /api/v1/articoli/{articleId}/bozza (reopenRejectedArticle, RF2.7, UC_18/21): RIFIUTATO -> BOZZA. */
export async function reopenRejectedArticle(articleId: number): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/articoli/${articleId}/bozza`, { method: "POST" });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile riaprire l'articolo per la correzione. Riprova."));
    return false;
  }

  return true;
}
