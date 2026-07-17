const COOKIE_NAME = "mmh_cookie_consent";

// RNF6.3: preferenze memorizzate per un periodo ragionevole (~12 mesi).
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface CookieConsentValue {
  /** I cookie tecnici sono sempre attivi (RNF6.2): solo gli analitici sono un consenso esplicito da tracciare. */
  analitici: boolean;
  decidedAt: string;
}

/**
 * Cookie non httpOnly, a differenza di mmh_rt: non è un segreto di sessione,
 * è una preferenza UI che il client deve poter leggere e scrivere da solo,
 * senza coinvolgere il backend.
 */
export function readConsentCookie(): CookieConsentValue | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(/(?:^|;\s*)mmh_cookie_consent=([^;]*)/);
  if (!match) {
    return null;
  }
  try {
    return JSON.parse(decodeURIComponent(match[1])) as CookieConsentValue;
  } catch {
    return null;
  }
}

export function writeConsentCookie(value: CookieConsentValue): void {
  const encoded = encodeURIComponent(JSON.stringify(value));
  document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}
