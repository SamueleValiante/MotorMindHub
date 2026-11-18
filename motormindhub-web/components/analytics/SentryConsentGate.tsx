"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useCookieConsentStore } from "@/lib/cookie-consent/store";

/**
 * Avvia il monitoraggio errori lato browser (Sentry) solo se l'utente ha
 * dato il consenso "analitici" (RNF6.2): prima di allora nessuna richiesta
 * parte verso Sentry. Se il consenso viene revocato dal link "Preferenze
 * cookie", il client viene chiuso e smette di inviare eventi.
 *
 * Lettura reattiva dello store, come PageViewTracker: l'idratazione del
 * consenso avviene nell'effect di CookieBanner, quindi al primo render
 * `analitici` è ancora false anche per chi aveva già accettato.
 */
export function SentryConsentGate() {
  const analitici = useCookieConsentStore((s) => s.analitici);

  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) {
      return;
    }
    if (analitici) {
      if (!Sentry.getClient()) {
        Sentry.init({ dsn });
      }
    } else {
      void Sentry.close();
    }
  }, [analitici]);

  return null;
}
