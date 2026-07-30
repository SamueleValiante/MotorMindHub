import { notFound } from "next/navigation";
import { qaFixturesEnabled } from "@/lib/qa/fixturesEnabled";
import { ToastTriggerButton } from "./ToastTriggerButton";

/**
 * Fixture per il test di regressione Playwright (e2e/toast-cookie-overlap.spec.ts):
 * non è una pagina di prodotto. ToastViewport e CookieBanner sono già montati
 * globalmente nel root layout; questa pagina serve solo a dare al test un
 * modo stabile per far comparire un toast (nell'app reale scatta da azioni
 * mutanti nelle varie pagine, ancora da costruire).
 *
 * Irraggiungibile in produzione: cfr. lib/qa/fixturesEnabled.ts, guard
 * esplicito su QA_FIXTURES_ENABLED (non NODE_ENV — il job "e2e" di ci.yml
 * builda in produzione ma deve comunque poter raggiungere questa pagina).
 */
export default function ToastCookieOverlapFixture() {
  if (!qaFixturesEnabled()) {
    notFound();
  }

  return <ToastTriggerButton />;
}
