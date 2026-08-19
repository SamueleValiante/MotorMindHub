import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

/**
 * withSentryConfig abilita l'upload dei source map al build — richiede
 * SENTRY_AUTH_TOKEN (non impostato qui: nessun login Sentry disponibile in
 * questo ambiente). Senza token il plugin si limita a un warning a build
 * time e non carica i source map, il resto (init client/server/edge,
 * cattura errori) funziona comunque: token da aggiungere in seguito nelle
 * env var di Vercel quando disponibile.
 */
export default withSentryConfig(nextConfig, {
  silent: true,
});
