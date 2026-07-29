import { notFound } from "next/navigation";
import { Suspense } from "react";
import { qaFixturesEnabled } from "@/lib/qa/fixturesEnabled";
import { LinkToConfermaEmailFixtureContent } from "./LinkToConfermaEmailFixtureContent";

/**
 * Fixture per il test di regressione Playwright (e2e/register-confirm.spec.ts):
 * non è una pagina di prodotto. Nessuna pagina reale linka mai a
 * /conferma-email (ci si arriva quasi sempre da un link email esterno, un
 * hard navigation) — ma serve comunque poterla raggiungere con un <Link>
 * dell'App Router per riprodurre il bug di strict-mode gemello di quello
 * già trovato in useArticle/useEditableArticle (mount -> cleanup -> mount
 * sincrono che annulla l'unica fetch/verifica che sarebbe poi andata a
 * buon fine): un page.goto diretto non lo innesca. Irraggiungibile in
 * produzione, stesso schema di app/qa/toast-cookie-overlap e
 * app/qa/report-user.
 */
export default function LinkToConfermaEmailFixture() {
  if (!qaFixturesEnabled()) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <LinkToConfermaEmailFixtureContent />
    </Suspense>
  );
}
