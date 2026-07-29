import { notFound } from "next/navigation";
import { Suspense } from "react";
import { qaFixturesEnabled } from "@/lib/qa/fixturesEnabled";
import { ReportUserFixtureContent } from "./ReportUserFixtureContent";

/**
 * Fixture per il test di regressione Playwright (e2e/report-user.spec.ts):
 * non è una pagina di prodotto — il profilo pubblico da cui ReportButton
 * verrà davvero usato non esiste ancora (fuori scope di GestioneUtenti,
 * cfr. riepilogo). Irraggiungibile in produzione, stesso schema di
 * app/qa/toast-cookie-overlap.
 */
export default function ReportUserFixture() {
  if (!qaFixturesEnabled()) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <ReportUserFixtureContent />
    </Suspense>
  );
}
