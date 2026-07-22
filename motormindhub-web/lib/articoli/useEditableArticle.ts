import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { ArticleDetail } from "./types";

type State =
  | { status: "loading" }
  | { status: "found"; articolo: ArticleDetail }
  | { status: "not-found" };

/**
 * Variante di useArticle per l'Editor (punto 8): a differenza della pagina di
 * dettaglio pubblica, qui serve poter ricaricare esplicitamente lo stesso id
 * dopo una mutazione — reopenRejectedArticle riporta un RIFIUTATO a BOZZA,
 * l'editor deve rileggere il nuovo stato sul posto, senza un giro di
 * navigazione (cfr. ArticleEditor). Stessa chiamata pubblica di useArticle
 * (GET /api/v1/articoli/{id}, incrementa numeroVisualizzazioni ad ogni
 * chiamata — side effect già documentato lì, qui inevitabile: è l'unico
 * endpoint che restituisce testo/tag/categoriaId, getArticlesByAuthor
 * (ArticleSummaryDTO) non basta a popolare l'editor).
 *
 * A differenza di useArticle, la "richiesta ancora valida?" non è un
 * booleano `cancelled` per-effetto: in React StrictMode il ciclo sincrono
 * mount -> cleanup -> remount farebbe scattare quella cleanup (e quindi
 * `cancelled = true`) sull'UNICA fetch che poi arriva davvero a
 * completamento, perché la guardia sull'id già richiesto impedisce al
 * remount di avviarne una seconda — risultato osservato: l'editor resta
 * bloccato su "Caricamento…" per sempre. Qui la validità si verifica al
 * momento della risposta confrontando requestedIdRef.current con l'id di
 * quella specifica richiesta: sopravvive al replay sincrono di StrictMode
 * (il ref non cambia) e scarta comunque una risposta arrivata in ritardo
 * per un id nel frattempo superato da un altro.
 */
export function useEditableArticle(articleId: number | null): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" });
  const requestedIdRef = useRef<number | null>(null);

  const load = useCallback(() => {
    if (articleId === null) return;
    const targetId = articleId;

    apiFetch(`/api/v1/articoli/${targetId}`, { skipAuth: true })
      .then(async (response) => {
        if (requestedIdRef.current !== targetId) return;
        if (response.ok) {
          setState({ status: "found", articolo: await response.json() });
        } else {
          setState({ status: "not-found" });
        }
      })
      .catch(() => {
        if (requestedIdRef.current === targetId) setState({ status: "not-found" });
      });
  }, [articleId]);

  useEffect(() => {
    if (articleId === null || requestedIdRef.current === articleId) {
      return;
    }
    requestedIdRef.current = articleId;
    load();
  }, [articleId, load]);

  return { ...state, reload: load };
}
