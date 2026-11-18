import * as Sentry from "@sentry/nextjs";

/**
 * instrumentation-client.ts (convenzione Next.js, sostituisce il vecchio
 * sentry.client.config.ts): caricato automaticamente prima di qualunque
 * altro codice client.
 *
 * NIENTE Sentry.init qui: inizializzare Sentry nel browser fa partire
 * richieste verso ingest.sentry.io (con IP e dati tecnici del visitatore)
 * prima che l'utente abbia scelto sui cookie. L'init avviene in
 * components/analytics/SentryConsentGate.tsx solo dopo il consenso
 * "analitici" (RNF6.2). Finché Sentry non è inizializzato, l'export qui
 * sotto è un no-op e non invia nulla.
 */

// Richiesto esplicitamente dall'SDK per collegare i breadcrumb di
// navigazione client-side (route → route) al contesto degli errori.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
