export type StatoSegnalazione = "APERTA" | "IN_GESTIONE" | "ARCHIVIATA";

/** ReportQueueItemDTO (GestioneAmministrazioneUtenti.getReportsQueue, RF4.5/RF4.6, UC_26). */
export interface ReportQueueItem {
  id: number;
  segnalatoId: number;
  segnalatoNome: string;
  segnalatoEmail: string;
  motivazione: string;
  stato: StatoSegnalazione;
  dataCreazione: string;
}

/**
 * StatoRichiestaCancellazione (backend): RESPINTA esiste nell'enum ma non è mai
 * assegnata da nessun metodo (nessun endpoint di "rifiuto" — verificato nel
 * codice, GestioneAmministrazioneUtenti.processAccountDeletion imposta solo
 * COMPLETATA). Mappato comunque per completezza dello stato, ma non ha un'azione
 * dedicata nella UI.
 */
export type StatoRichiestaCancellazione = "IN_CODA" | "COMPLETATA" | "RESPINTA";

/** DeletionRequestQueueItemDTO (GestioneAmministrazioneUtenti.getDeletionRequestsQueue, RF4.6, UC_25). */
export interface DeletionRequestQueueItem {
  id: number;
  utenteId: number;
  utenteNome: string;
  utenteEmail: string;
  stato: StatoRichiestaCancellazione;
  dataRichiesta: string;
}

/**
 * Mirror di MotivazioneSospensione (backend, gestioneAmministrazioneUtenti/dto):
 * l'etichetta deve restare identica al valore restituito da getEtichetta(), il
 * valore è quello inviato come SuspensionDTO.motivazione.
 */
export const MOTIVAZIONI_SOSPENSIONE = [
  { value: "CONTENUTI_INAPPROPRIATI", label: "Violazione dei Termini di Servizio - contenuti inappropriati" },
  { value: "LINGUAGGIO_OFFENSIVO", label: "Violazione dei Termini di Servizio - linguaggio offensivo" },
  { value: "SPAM", label: "Violazione dei Termini di Servizio - spam ripetuto" },
  { value: "MOLESTIE", label: "Violazione dei Termini di Servizio - molestie verso altri utenti" },
  { value: "NOME_UTENTE_NON_CONFORME", label: "Violazione dei Termini di Servizio - nome utente non conforme" },
  { value: "ALTRO", label: "Altro (specificare nelle note)" },
] as const;

export type MotivazioneSospensione = (typeof MOTIVAZIONI_SOSPENSIONE)[number]["value"];

/** SuspensionDTO (backend): durataGiorni null = sospensione permanente. */
export interface SuspensionInput {
  motivazione: MotivazioneSospensione;
  noteAggiuntive: string | null;
  durataGiorni: number | null;
}

export type StatoUtente = "NON_VERIFICATO" | "ATTIVO" | "SOSPESO" | "CANCELLATO";

/** UserSummaryDTO (GestioneAmministrazioneUtenti.searchUsers, RF4.2, UC_22). */
export interface UserSummary {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  stato: StatoUtente;
  dataRegistrazione: string;
}

export type TipoAzioneAmministrativa = "SOSPENSIONE" | "RIATTIVAZIONE" | "CANCELLAZIONE" | "ESPORTAZIONE";

/**
 * AdministrativeActionLogEntryDTO (GestioneAmministrazioneUtenti.getAdministrativeActionLog, RF4.8).
 * Nessun campo "operatore" (chi ha eseguito l'azione): scelta di design
 * deliberata e documentata nell'entità backend LogAzioneAmministrativa,
 * non un'omissione — il mockup 48 lo mostra ma non è disponibile.
 */
export interface AdministrativeActionLogEntry {
  dataAzione: string;
  tipoAzione: TipoAzioneAmministrativa;
  utenteTargetId: number;
  utenteTargetNome: string;
  dettaglio: string | null;
}

/** UserManagementDashboardDTO (GestioneAmministrazioneUtenti.getUserManagementDashboard, RF4.1). */
export interface UserManagementDashboardStats {
  utentiRegistrati: number;
  segnalazioniAperte: number;
  richiesteCancellazioneInCoda: number;
}
