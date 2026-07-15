package com.motormindhub.Api.model.entity;

/**
 * IN_CANCELLAZIONE e CANCELLATO non sono sinonimi: IN_CANCELLAZIONE e' lo stato transitorio "in
 * attesa di lavorazione" di un account con una RichiestaCancellazione IN_CODA (RF4.2, mockup
 * 39_gestore_gestione_account.png - badge "IN CANCELLAZIONE"); CANCELLATO e' lo stato terminale
 * impostato da Utente.anonimizza() una volta che GestioneAmministrazioneUtenti.processAccountDeletion
 * ha elaborato la richiesta (RF4.6, RNF5.5) - da quel momento l'account non e' piu' un utente
 * "normale" e va escluso dalle liste/contatori standard del Gestore Utenti (cfr.
 * UtenteRepository.search, GestioneAmministrazioneUtenti.getUserManagementDashboard).
 */
public enum StatoUtente {
    NON_VERIFICATO,
    ATTIVO,
    SOSPESO,
    IN_CANCELLAZIONE,
    CANCELLATO
}
