import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import { useAuthStore } from "@/lib/auth/store";
import type { ArticleDetail } from "./types";

type State =
  | { status: "loading" }
  | { status: "found"; articolo: ArticleDetail }
  | { status: "not-found" };

/**
 * GET /api/v1/articoli/{articleId} — pubblico (permitAll in SecurityConfig,
 * RF1.1): non RICHIEDE autenticazione (un Guest deve poterla vedere), il
 * che è diverso da "il token va nascosto se esiste". Niente skipAuth: true
 * qui — apiFetch allega già il token solo se presente in memoria (nessun
 * Authorization header per un Guest davvero anonimo), skipAuth lo
 * sopprimerebbe anche quando un Autore/Manager Autori è loggato, facendo
 * arrivare al backend una richiesta indistinguibile da un Guest. Rilevante
 * perché getArticleById incrementa numeroVisualizzazioni solo per un
 * ruolo non redazionale (Guest/Iscritto, cfr. GestioneArticoli): con
 * skipAuth un Autore che rilegge il proprio articolo pubblicato ne
 * gonfierebbe artificialmente le letture, esattamente come una rilettura
 * in fase di revisione da parte di un Manager.
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
 *
 * L'effetto aspetta anche che authStatus non sia più "loading": l'access
 * token vive solo in memoria e viene ricostruito ad ogni caricamento
 * pagina da un refresh silenzioso asincrono (AuthProvider, in cima
 * all'albero) — su un caricamento a freddo (page.goto/refresh browser,
 * non una navigazione client-side dove il token è già in memoria da
 * prima) questo effetto altrimenti partirebbe PRIMA che il refresh
 * risolva, apiFetch leggerebbe accessToken ancora null e la richiesta
 * partirebbe senza header Authorization anche per un Autore/Manager
 * autenticato — lo stesso identico effetto collaterale di skipAuth: true
 * sul contatore letture, ma per una race invece che per una rimozione
 * esplicita del token. Stesso pattern già usato da RoleGuard per le
 * route protette (qui senza redirect: la pagina resta pubblica, si
 * aspetta solo prima di sparare la fetch che ha un side effect
 * dipendente dal ruolo).
 */
export function useArticle(articleId: number | null): State {
  const [state, setState] = useState<State>({ status: "loading" });
  const requestedIdRef = useRef<number | null>(null);
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    if (articleId === null || authStatus === "loading" || requestedIdRef.current === articleId) {
      return;
    }
    requestedIdRef.current = articleId;
    const targetId = articleId;

    apiFetch(`/api/v1/articoli/${targetId}`)
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
  }, [articleId, authStatus]);

  return articleId === null ? { status: "not-found" } : state;
}
