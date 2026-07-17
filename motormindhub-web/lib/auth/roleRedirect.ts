import type { Ruolo } from "./jwt";

/** Area personale di ciascun ruolo dopo il login (RAD UC_2). */
export const ROLE_HOME_PATH: Record<Ruolo, string> = {
  ISCRITTO: "/account",
  AUTORE: "/autore",
  MANAGER_AUTORI: "/manager",
  GESTORE_UTENTI: "/gestore",
};
