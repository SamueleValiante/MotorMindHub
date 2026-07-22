import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { ArticleDetail } from "./types";

type State =
  | { status: "loading" }
  | { status: "found"; articolo: ArticleDetail }
  | { status: "not-found" };

/**
 * GET /api/v1/articoli/{articleId} — pubblico (permitAll in SecurityConfig,
 * RF1.1), niente token da allegare.
 *
 * getArticleById incrementa numeroVisualizzazioni ad ogni chiamata reale
 * (side effect lato server, non idempotente — lo stesso conteggio usato
 * per l'ordinamento "Più lette" in Esplora): senza la guardia sull'id già
 * richiesto, lo strict-mode di React in dev (mount → cleanup → mount)
 * chiamerebbe l'endpoint due volte per lo stesso caricamento, gonfiando
 * artificialmente il contatore. Stesso bug già risolto per il consumo del
 * token di conferma email (ConfirmEmailContent).
 *
 * La validità della risposta si verifica confrontando requestedIdRef.current
 * con l'id di quella specifica richiesta, non con un flag `cancelled`
 * locale all'effetto: quel flag veniva impostato a true dalla cleanup
 * sincrona del replay di StrictMode (mount -> cleanup -> mount, tutto prima
 * che il fetch possa risolversi), e la guardia sull'id già richiesto
 * impediva al remount di avviarne una seconda — risultato, l'unica fetch
 * rimasta in volo veniva sempre scartata e la pagina restava bloccata su
 * "Caricamento…". Riproducibile solo su una navigazione client-side (un
 * <Link> dell'App Router verso questa pagina), non su un page.goto diretto
 * — bug gemello di quello trovato e corretto in useEditableArticle
 * (Editor, punto 8), stesso fix.
 */
export function useArticle(articleId: number | null): State {
  const [state, setState] = useState<State>({ status: "loading" });
  const requestedIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (articleId === null || requestedIdRef.current === articleId) {
      return;
    }
    requestedIdRef.current = articleId;
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

  return articleId === null ? { status: "not-found" } : state;
}
