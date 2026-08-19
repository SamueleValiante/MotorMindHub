// force-dynamic: senza questo, "next build" prova a prerenderizzare la pagina
// staticamente e il throw incondizionato fa fallire l'intero build (visto dal
// vivo sul deploy Vercel) — in dev il problema non si presenta perché next dev
// non prerenderizza in anticipo, solo alla richiesta.
export const dynamic = "force-dynamic";

export default function SentryTestTmpServerPage() {
  throw new Error("Errore di prova Sentry (Server Component) — rimuovere dopo la verifica.");
}
