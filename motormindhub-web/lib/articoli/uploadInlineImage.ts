import { apiFetch } from "@/lib/http/client";

interface ErrorBody {
  messages?: string[];
}

/**
 * Upload di un'immagine inline per il corpo Markdown dell'articolo
 * (POST /api/v1/articoli/immagini-corpo, stessa validazione JPEG/PNG/WEBP
 * max 5MB di /copertine). A differenza di ImageUploadField non gestisce
 * anteprima/stato: usata dalla toolbar di ArticleBodyEditor, che ha il suo
 * proprio stato di caricamento e inserisce l'URL restituito direttamente
 * nel documento TipTap. Lancia un errore con lo stesso messaggio che il
 * backend restituisce (o uno generico), da mostrare via toast dal chiamante.
 */
export async function uploadInlineImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await apiFetch("/api/v1/articoli/immagini-corpo", { method: "POST", body: formData });
  } catch {
    throw new Error("Impossibile contattare il server. Riprova più tardi.");
  }

  if (!response.ok) {
    let body: ErrorBody = {};
    try {
      body = await response.json();
    } catch {
      // corpo non JSON: si ricade sul messaggio generico sotto
    }
    throw new Error(body.messages?.[0] ?? "Non è stato possibile caricare l'immagine. Riprova.");
  }

  const { url } = (await response.json()) as { url: string };
  return url;
}
