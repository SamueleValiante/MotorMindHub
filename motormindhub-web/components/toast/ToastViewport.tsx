"use client";

import { useToastStore, type ToastVariant } from "@/lib/toast/store";
import { useCookieConsentStore } from "@/lib/cookie-consent/store";
import { CheckIcon, ErrorIcon, InfoIcon } from "./icons";

// Colori da docs/DESIGN_SYSTEM.md: errore e info coincidono con ember/accent,
// successo con "Success green" (--color-success, campionato dal mockup
// 50_component_toast.png e poi aggiunto in tabella).
const VARIANT_STYLES: Record<
  ToastVariant,
  { Icon: typeof CheckIcon; accentClassName: string; ariaLive: "polite" | "assertive" }
> = {
  success: {
    Icon: CheckIcon,
    accentClassName: "border-success text-success",
    ariaLive: "polite",
  },
  error: {
    Icon: ErrorIcon,
    accentClassName: "border-ember text-ember",
    ariaLive: "assertive",
  },
  info: {
    Icon: InfoIcon,
    accentClassName: "border-accent text-accent",
    ariaLive: "polite",
  },
};

/**
 * Montato una sola volta nel root layout (come AuthProvider). Posizione
 * in basso a sinistra: da PS §2.5 / RAD §3.4.1.5 ("una notifica a
 * comparsa in basso a sinistra dello schermo").
 */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const cookieStatus = useCookieConsentStore((s) => s.status);
  const cookiePanelOpen = useCookieConsentStore((s) => s.panelOpen);

  if (toasts.length === 0) {
    return null;
  }

  // Entrambi sono elementi fixed che rivendicano l'angolo in basso a
  // sinistra: quando il cookie banner (o il suo pannello esteso di
  // personalizzazione) è visibile, i toast si spostano più in alto per
  // non finirci sotto. Nessun'altra logica condivisa tra i due componenti.
  const cookieUiVisible = cookieStatus === "pending" || cookiePanelOpen;

  return (
    <div
      data-testid="toast-viewport"
      className={`fixed left-4 z-50 flex w-full max-w-sm flex-col gap-2 transition-[bottom] ${
        cookieUiVisible ? "bottom-64" : "bottom-4"
      }`}
    >
      {toasts.map((item) => {
        const { Icon, accentClassName, ariaLive } = VARIANT_STYLES[item.variant];
        return (
          <div
            key={item.id}
            role="status"
            aria-live={ariaLive}
            className={`flex items-center gap-3 rounded-md border-l-4 bg-carbon px-4 py-3 shadow-lg ${accentClassName}`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <p className="font-body text-sm text-paper">{item.message}</p>
          </div>
        );
      })}
    </div>
  );
}
