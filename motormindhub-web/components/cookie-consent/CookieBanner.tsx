"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCookieConsentStore } from "@/lib/cookie-consent/store";

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

  if (status === "decided" && !panelOpen) {
    return null;
  }

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

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div
        data-testid="cookie-banner"
        className="w-full max-w-4xl rounded-xl bg-carbon p-6 shadow-xl"
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
            <h2 className="font-heading text-base font-bold uppercase tracking-wide text-paper">
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
