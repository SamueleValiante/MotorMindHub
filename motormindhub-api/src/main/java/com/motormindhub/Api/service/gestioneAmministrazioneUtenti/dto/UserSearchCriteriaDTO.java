package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import com.motormindhub.Api.model.entity.StatoUtente;

/** RF4.2, UC_22 - mockup 39_gestore_gestione_account.png (barra di ricerca + tab di stato). */
public record UserSearchCriteriaDTO(
        String query,
        StatoUtente stato
) {
}
