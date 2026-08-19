import * as Sentry from "@sentry/nextjs";

/**
 * instrumentation-client.ts (convenzione Next.js, sostituisce il vecchio
 * sentry.client.config.ts): caricato automaticamente prima di qualunque
 * altro codice client, cattura errori JS non gestiti e unhandled promise
 * rejection nel browser senza bisogno di error boundary manuali per
 * ognuno — solo error tracking, nessun performance/session-replay sampling
 * qui (fuori scope, aggiungibile in seguito con tracesSampleRate/
 * replaysSessionSampleRate se servirà).
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

// Richiesto esplicitamente dall'SDK per collegare i breadcrumb di
// navigazione client-side (route → route) al contesto degli errori.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
