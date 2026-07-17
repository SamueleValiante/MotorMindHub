import { create } from "zustand";
import { readConsentCookie, writeConsentCookie } from "./cookie";

type CookieConsentStatus = "pending" | "decided";

interface CookieConsentState {
  status: CookieConsentStatus;
  // TODO: nessuno script da bloccare ancora — non è integrato alcun tool di
  // analytics, quindi oggi questo flag è solo stato UI (persistito nel
  // cookie per RNF6.3, mostrato/nascosto nel pannello) senza alcun effetto
  // a runtime. Collegare qui quando si integra un tool di analytics,
  // verificando questo stato prima di caricarne lo script (RNF6.2: i
  // cookie di profilazione si attivano solo dopo consenso esplicito).
  analitici: boolean;
  /** true quando il banner o il pannello di personalizzazione devono essere visibili. */
  panelOpen: boolean;
  hydrate: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  saveCustom: (analitici: boolean) => void;
  /** Da richiamare dal link "Preferenze cookie" nel footer (non ancora implementato) per riaprire il pannello dopo la prima decisione. */
  openPreferences: () => void;
}

function persistAndClose(
  set: (partial: Partial<CookieConsentState>) => void,
  analitici: boolean
) {
  writeConsentCookie({ analitici, decidedAt: new Date().toISOString() });
  set({ status: "decided", analitici, panelOpen: false });
}

export const useCookieConsentStore = create<CookieConsentState>((set) => ({
  status: "pending",
  analitici: false,
  panelOpen: false,
  hydrate: () => {
    const existing = readConsentCookie();
    set({
      status: existing ? "decided" : "pending",
      analitici: existing?.analitici ?? false,
      panelOpen: !existing,
    });
  },
  acceptAll: () => persistAndClose(set, true),
  rejectAll: () => persistAndClose(set, false),
  saveCustom: (analitici) => persistAndClose(set, analitici),
  openPreferences: () => set({ panelOpen: true }),
}));
