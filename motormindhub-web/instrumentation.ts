import * as Sentry from "@sentry/nextjs";

/**
 * register() gira una volta per runtime all'avvio del server Next.js
 * (nodejs per route handler/Server Component, edge per il middleware):
 * Sentry.init va chiamato qui, non in un modulo import-ato staticamente,
 * perché il runtime edge non supporta tutte le API Node su cui il resto
 * dell'SDK fa affidamento se caricato fuori da questo hook.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  }
}

/**
 * Hook ufficiale Next.js (>=15) invocato per ogni errore non gestito emerso
 * durante il rendering di un Server Component o l'esecuzione di un route
 * handler: captureRequestError lo inoltra a Sentry con contesto richiesta
 * già estratto (metodo, URL, route), senza bisogno di try/catch manuali in
 * ogni handler.
 */
export const onRequestError = Sentry.captureRequestError;
