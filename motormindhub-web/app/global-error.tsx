"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

/**
 * global-error.tsx (convenzione Next.js App Router): unico error boundary
 * che copre anche il root layout stesso — sostituisce interamente
 * html/body quando scatta, per questo non riusa lo stile del resto
 * dell'app (che vive nel layout che qui potrebbe essere la causa del
 * crash). captureException qui è l'unico modo di intercettare un errore
 * di rendering del root layout: onRequestError (instrumentation.ts)
 * copre Server Component/route handler, non il crash del layout React
 * stesso lato client.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="it">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
