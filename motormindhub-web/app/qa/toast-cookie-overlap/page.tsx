import { notFound } from "next/navigation";
import { ToastTriggerButton } from "./ToastTriggerButton";

/**
 * Fixture per il test di regressione Playwright (e2e/toast-cookie-overlap.spec.ts):
 * non è una pagina di prodotto. ToastViewport e CookieBanner sono già montati
 * globalmente nel root layout; questa pagina serve solo a dare al test un
 * modo stabile per far comparire un toast (nell'app reale scatta da azioni
 * mutanti nelle varie pagine, ancora da costruire).
 *
 * Irraggiungibile in produzione: `next dev` (usato da Playwright via
 * webServer in playwright.config.ts) gira sempre con NODE_ENV=development,
 * mentre `next build`/`next start` forzano NODE_ENV=production.
 */
export default function ToastCookieOverlapFixture() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ToastTriggerButton />;
}
