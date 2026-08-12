"use client";

import { useEffect, useRef } from "react";
import { useCookieConsentStore } from "@/lib/cookie-consent/store";
import { useAuthStore } from "@/lib/auth/store";
import { apiFetch } from "@/lib/http/client";

/**
 * Registra una visita una sola volta per bootstrap dell'app (non ad ogni
 * cambio pagina), solo se il consenso "analitici" è true (RNF6.2). Non
 * legge/scrive/manipola alcun cookie: POST /api/v1/visite (RF3.1, UC_28) è
 * interamente gestito dal backend (cookie di sessione mmh_visit_session,
 * HttpOnly), qui serve solo credentials: "include" perché il browser lo
 * mandi/riceva cross-origin.
 *
 * Niente skipAuth: se l'utente è autenticato l'Authorization Bearer va
 * comunque inviato, è il modo in cui il backend distingue Iscritto da Guest
 * ed esclude i ruoli redazionali dal conteggio (GestioneAmministrazioneUtenti
 * .registraVisita) — con skipAuth l'header sparirebbe e un Autore/Manager/
 * Gestore loggato verrebbe contato come Guest invece che escluso.
 *
 * L'effetto aspetta anche che useAuthStore().status non sia più "loading" -
 * stesso identico bug (di razza, non di skipAuth) già trovato e corretto in
 * useArticle/useEditableArticle per il conteggio letture articolo: l'access
 * token vive solo in memoria e viene ricostruito ad ogni caricamento pagina
 * da un refresh silenzioso asincrono (AuthProvider, in cima all'albero, qui
 * SOLO sibling di questo componente, non genitore - non lo "aspetta" per
 * costruzione). Su un caricamento a freddo, questo effetto partirebbe PRIMA
 * che il refresh risolva: apiFetch leggerebbe accessToken ancora null e la
 * richiesta partirebbe senza header Authorization anche per un Autore/
 * Manager/Gestore già autenticato, che il backend tratterebbe quindi come
 * Guest (nessun retry possibile: l'endpoint risponde 204, mai 401, quindi
 * l'interceptor 401 di apiFetch non si attiva mai qui) - la visita di un
 * ruolo redazionale finirebbe comunque contata, esclusa solo nominalmente.
 *
 * Lettura reattiva dello store (non una tantum): CookieBanner idrata lo
 * stato del consenso dal cookie nel proprio effect, quindi al primo render
 * `analitici` è ancora false anche se l'utente aveva già accettato in una
 * sessione precedente - l'effect qui sotto si riattiva da solo quando lo
 * store si aggiorna, sia per l'idratazione iniziale sia per un consenso
 * dato più tardi dal banner.
 */
export function PageViewTracker() {
  const analitici = useCookieConsentStore((s) => s.analitici);
  const authStatus = useAuthStore((s) => s.status);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!analitici || authStatus === "loading" || hasTracked.current) {
      return;
    }
    hasTracked.current = true;

    apiFetch("/api/v1/visite", {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Fallimento silenzioso: un mancato tracciamento non è mai un errore da mostrare all'utente.
    });
  }, [analitici, authStatus]);

  return null;
}
