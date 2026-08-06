import type { Ruolo } from "./jwt";

/**
 * Area personale di ciascun ruolo dopo il login (RAD UC_2).
 *
 * ISCRITTO -> home pubblica, non /account: non ha un'area di lavoro (a
 * differenza degli altri 3 ruoli), quindi atterrare sulla panoramica
 * account vuota subito dopo il login è meno utile che tornare al
 * contenuto. /account resta comunque raggiungibile in ogni momento dal
 * menu utente (UserMenu) in header — questo cambia solo la destinazione
 * automatica post-login, non rimuove la pagina.
 */
export const ROLE_HOME_PATH: Record<Ruolo, string> = {
  ISCRITTO: "/",
  AUTORE: "/autore",
  MANAGER_AUTORI: "/manager",
  GESTORE_UTENTI: "/gestore",
};
