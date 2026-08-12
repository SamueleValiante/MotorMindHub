"use client";

import { useEffect, useRef } from "react";
import { useCookieConsentStore } from "@/lib/cookie-consent/store";
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
 * Lettura reattiva dello store (non una tantum): CookieBanner idrata lo
 * stato del consenso dal cookie nel proprio effect, quindi al primo render
 * `analitici` è ancora false anche se l'utente aveva già accettato in una
 * sessione precedente - l'effect qui sotto si riattiva da solo quando lo
 * store si aggiorna, sia per l'idratazione iniziale sia per un consenso
 * dato più tardi dal banner.
 */
export function PageViewTracker() {
  const analitici = useCookieConsentStore((s) => s.analitici);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!analitici || hasTracked.current) {
      return;
    }
    hasTracked.current = true;

    apiFetch("/api/v1/visite", {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Fallimento silenzioso: un mancato tracciamento non è mai un errore da mostrare all'utente.
    });
  }, [analitici]);

  return null;
}
