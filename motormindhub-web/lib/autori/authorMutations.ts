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

export interface InviteAuthorInput {
  nome: string;
  cognome: string;
  email: string;
  ruolo: "AUTORE" | "MANAGER_AUTORI";
}

/** POST /api/v1/autori/inviti (inviteAuthor, RF3.3, UC_8) — solo MANAGER_AUTORI. */
export async function inviteAuthor(dto: InviteAuthorInput): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch("/api/v1/autori/inviti", { method: "POST", body: JSON.stringify(dto) });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile inviare l'invito. Riprova."));
    return false;
  }

  toast.success("Invito inviato con successo.");
  return true;
}

/** DELETE /api/v1/autori/{authorId} (removeAuthor, RF3.4, UC_11) — solo MANAGER_AUTORI. */
export async function removeAuthor(authorId: number, mantieniArticoli: boolean): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/autori/${authorId}`, {
      method: "DELETE",
      body: JSON.stringify({ mantieniArticoli }),
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile rimuovere l'autore. Riprova."));
    return false;
  }

  toast.success("Autore rimosso con successo.");
  return true;
}

/** POST /api/v1/autori/articoli/{articleId}/approvazione (approveArticle, RF3.6, UC_21) — solo MANAGER_AUTORI. */
export async function approveArticle(articleId: number): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/autori/articoli/${articleId}/approvazione`, { method: "POST" });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile approvare l'articolo. Riprova."));
    return false;
  }

  toast.success("Articolo approvato e pubblicato.");
  return true;
}

/** POST /api/v1/autori/articoli/{articleId}/rifiuto (rejectArticle, RF3.6, UC_21) — solo MANAGER_AUTORI. */
export async function rejectArticle(articleId: number, motivazione: string): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/autori/articoli/${articleId}/rifiuto`, {
      method: "POST",
      body: JSON.stringify({ motivazione }),
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile rifiutare l'articolo. Riprova."));
    return false;
  }

  toast.success("Articolo rifiutato.");
  return true;
}
