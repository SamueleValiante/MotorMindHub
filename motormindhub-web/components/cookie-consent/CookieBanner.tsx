"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCookieConsentStore } from "@/lib/cookie-consent/store";
import { useFocusTrap } from "@/lib/shared/useFocusTrap";

const primaryButtonClassName =
  "rounded-md bg-amber px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-asphalt";
const secondaryButtonClassName =
  "rounded-md border border-chrome/60 px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-paper";
const tertiaryButtonClassName =
  "rounded-md border border-chrome/40 px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-chrome";

/**
 * Cookie banner conforme a RNF6.1-RNF6.4 (provvedimento Garante Privacy
 * 8 luglio 2021), non un semplice accetta/rifiuta come nel solo mockup
 * (docs/mockups/10_cookie_banner.png) potrebbe suggerire a un primo
 * sguardo: il RAD richiede esplicitamente scelta granulare (accetta
 * tutti / rifiuta tutti / personalizza per categoria), persistenza
 * ~12 mesi senza ripresentazione ripetuta, e nessun dark pattern (il
 * bottone "rifiuta" non è meno visibile di "accetta": stessa dimensione,
 * stesso peso testo Paper, entrambi bordati vs. il riempimento amber di
 * "accetta" che segnala solo l'azione predefinita, non ne nasconde una).
 *
 * I cookie tecnici sono sempre attivi (RNF6.2, nessun consenso richiesto);
 * solo la categoria analitici è un vero opt-in.
 */
export function CookieBanner() {
  const status = useCookieConsentStore((s) => s.status);
  const panelOpen = useCookieConsentStore((s) => s.panelOpen);
  const analitici = useCookieConsentStore((s) => s.analitici);
  const hydrate = useCookieConsentStore((s) => s.hydrate);
  const acceptAll = useCookieConsentStore((s) => s.acceptAll);
  const rejectAll = useCookieConsentStore((s) => s.rejectAll);
  const saveCustom = useCookieConsentStore((s) => s.saveCustom);

  const [showCustomize, setShowCustomize] = useState(false);
  const [draftAnalitici, setDraftAnalitici] = useState(analitici);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Transizioni esplicite invece di un effect che sincronizza lo stato
  // locale su panelOpen: sia perché più corretto (nessun setState in un
  // effect), sia perché il componente resta montato anche quando ritorna
  // null (il layout lo renderizza sempre), quindi uno stato locale non si
  // azzererebbe mai da solo tra un'apertura e la successiva.
  const handleOpenCustomize = () => {
    setDraftAnalitici(analitici);
    setShowCustomize(true);
  };
  const handleAcceptAll = () => {
    acceptAll();
    setShowCustomize(false);
  };
  const handleRejectAll = () => {
    rejectAll();
    setShowCustomize(false);
  };
  const handleSaveCustom = () => {
    saveCustom(draftAnalitici);
    setShowCustomize(false);
  };

  // Non un semplice dialog: e' un meccanismo di consenso legale (RNF6.1-RNF6.4,
  // provvedimento Garante Privacy 8 luglio 2021). Escape equivale a "Rifiuta tutti",
  // mai a un'accettazione silenziosa (Art. 4(11)/7 GDPR, Considerando 32: silenzio o
  // inattivita' non costituiscono consenso) e mai a "resta aperto" (ambiguo, incoerente
  // con gli altri modali dell'app). Vale identico da entrambe le sotto-viste.
  const isOpen = !(status === "decided" && !panelOpen);
  const containerRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: handleRejectAll,
    // Il passaggio compatta <-> personalizza non chiude/riapre il banner
    // (isOpen resta true): senza focusKey il focus non si sposterebbe mai
    // sul nuovo marker [data-focus-trap-initial] della sotto-vista appena
    // mostrata.
    focusKey: showCustomize,
  });

  if (!isOpen) {
    return null;
  }

  return (
    // pointer-events-none sul wrapper: è full-width (inset-x-0) anche se la
    // card visibile è più stretta e centrata, quindi senza questo la fascia
    // trasparente ai lati intercetterebbe comunque i click destinati al
    // contenuto sottostante (bug reale: bloccava il submit di form più
    // lunghi di quello di login, cfr. e2e/register-confirm.spec.ts).
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div
        ref={containerRef}
        data-testid="cookie-banner"
        role="dialog"
        aria-modal="true"
        aria-label="Preferenze cookie"
        className="pointer-events-auto w-full max-w-4xl rounded-xl bg-carbon p-6 shadow-xl"
      >
        {!showCustomize ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-chrome">
              <span className="font-heading font-bold text-paper">
                Rispettiamo la tua privacy.{" "}
              </span>
              Usiamo cookie tecnici necessari al funzionamento del sito e,
              previo consenso, cookie analitici per migliorare l&apos;esperienza.
              Consulta la{" "}
              <Link href="/cookie-policy" className="text-amber underline">
                Cookie Policy
              </Link>
              .
            </p>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={handleOpenCustomize}
                data-focus-trap-initial
                className={tertiaryButtonClassName}
              >
                Personalizza
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className={secondaryButtonClassName}
              >
                Rifiuta tutti
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className={primaryButtonClassName}
              >
                Accetta tutti
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h2
              tabIndex={-1}
              data-focus-trap-initial
              className="font-heading text-base font-bold uppercase tracking-wide text-paper outline-none"
            >
              Personalizza le preferenze cookie
            </h2>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-1 h-4 w-4 accent-fog"
              />
              <span className="text-sm text-chrome">
                <span className="font-heading font-bold text-paper">
                  Cookie tecnici (sempre attivi).{" "}
                </span>
                Necessari al funzionamento del sito (es. sessione, preferenze
                di lingua): non richiedono consenso.
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={draftAnalitici}
                onChange={(e) => setDraftAnalitici(e.target.checked)}
                className="mt-1 h-4 w-4 accent-amber"
              />
              <span className="text-sm text-chrome">
                <span className="font-heading font-bold text-paper">
                  Cookie analitici.{" "}
                </span>
                Ci aiutano a capire come viene usato il portale, per
                migliorarlo. Attivi solo con il tuo consenso esplicito.
              </span>
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className={tertiaryButtonClassName}
              >
                Indietro
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className={primaryButtonClassName}
              >
                Salva preferenze
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
