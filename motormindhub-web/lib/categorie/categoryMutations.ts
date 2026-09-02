import { toast } from "@/lib/toast/toast";
import { apiFetch } from "@/lib/http/client";

export interface CategoryFormInput {
  nome: string;
  categoriaPadreId: number | null;
  descrizione: string | null;
}

export interface CategoryDetail {
  id: number;
  nome: string;
  descrizione: string | null;
  categoriaPadreId: number | null;
}

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

/** GET /api/v1/categorie/{categoryId} — pubblico, usato per precompilare il form di modifica. */
export async function getCategoryById(categoryId: number): Promise<CategoryDetail | null> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/categorie/${categoryId}`, { skipAuth: true });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return null;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile caricare la categoria."));
    return null;
  }

  return response.json();
}

/** POST /api/v1/categorie (createCategory, RF2.5, UC_12) — AUTORE o MANAGER_AUTORI. */
export async function createCategory(dto: CategoryFormInput): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch("/api/v1/categorie", { method: "POST", body: JSON.stringify(dto) });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile creare la categoria. Riprova."));
    return false;
  }

  toast.success("Categoria creata con successo.");
  return true;
}

/**
 * PUT /api/v1/categorie/{categoryId} (updateCategory, RF2.6, UC_14) — AUTORE o MANAGER_AUTORI.
 * Il backend applica solo dto.descrizione: nome/categoriaPadreId vengono
 * accettati ma ignorati (GestioneCategorie.updateCategory). Per questo il
 * form di modifica invia comunque nome/categoriaPadreId correnti (richiesti
 * dalla validazione @Valid) ma li mantiene disabled in UI.
 */
export async function updateCategory(categoryId: number, dto: CategoryFormInput): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/categorie/${categoryId}`, { method: "PUT", body: JSON.stringify(dto) });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile aggiornare la categoria. Riprova."));
    return false;
  }

  toast.success("Categoria aggiornata con successo.");
  return true;
}

/** DELETE /api/v1/categorie/{categoryId} (deleteCategory, RF3.5, UC_13) — solo MANAGER_AUTORI. */
export async function deleteCategory(categoryId: number, categoriaDestinazioneId: number): Promise<boolean> {
  let response: Response;
  try {
    response = await apiFetch(`/api/v1/categorie/${categoryId}`, {
      method: "DELETE",
      body: JSON.stringify({ categoriaDestinazioneId }),
    });
  } catch {
    toast.error("Impossibile contattare il server. Riprova più tardi.");
    return false;
  }

  if (!response.ok) {
    toast.error(await extractErrorMessage(response, "Non è stato possibile eliminare la categoria. Riprova."));
    return false;
  }

  toast.success("Categoria eliminata e articoli riassegnati.");
  return true;
}
