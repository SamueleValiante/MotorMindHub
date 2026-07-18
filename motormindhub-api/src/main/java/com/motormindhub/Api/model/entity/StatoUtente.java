package com.motormindhub.Api.model.entity;

/**
 * CANCELLATO e' lo stato terminale impostato da Utente.anonimizza() una volta che
 * GestioneAmministrazioneUtenti.processAccountDeletion ha elaborato la richiesta (RF4.6, RNF5.5) -
 * da quel momento l'account non e' piu' un utente "normale" e va escluso dalle liste/contatori
 * standard del Gestore Utenti (cfr. UtenteRepository.search,
 * GestioneAmministrazioneUtenti.getUserManagementDashboard).
 *
 * Non esiste uno stato transitorio "in attesa di cancellazione" sull'utente: il mockup
 * 39_gestore_gestione_account.png mostrava un badge/filtro "IN CANCELLAZIONE" (in precedenza
 * mappato su un valore StatoUtente.IN_CANCELLAZIONE mai assegnato da nessun path di codice - dead
 * enum, rimosso), ma quell'informazione e' gia' interamente derivabile da RichiestaCancellazione
 * (stato IN_CODA), gia' la fonte usata da GestioneAmministrazioneUtenti.getUserManagementDashboard e
 * getDeletionRequestsQueue: duplicarla anche su Utente.stato e' stato deliberatamente scartato,
 * senza replicare il badge/filtro sulla lista utenti del mockup.
 */
public enum StatoUtente {
    NON_VERIFICATO,
    ATTIVO,
    SOSPESO,
    CANCELLATO
}
