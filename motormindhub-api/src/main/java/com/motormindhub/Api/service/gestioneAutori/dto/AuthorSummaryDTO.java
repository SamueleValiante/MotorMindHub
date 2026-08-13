package com.motormindhub.Api.service.gestioneAutori.dto;

import com.motormindhub.Api.model.entity.StatoUtente;

/**
 * RF3.2, UC_8 - mockup 30_manager_autori.png. percentualeApprovazione = PUBBLICATO / (IN_ATTESA_APPROVAZIONE
 * + PUBBLICATO + RIFIUTATO), null quando l'autore non ha mai sottomesso un articolo (denominatore 0,
 * cfr. GestioneAutori.calcolaPercentualeApprovazione) - distinto da 0.0, che significherebbe invece
 * "sottomessi, tutti rifiutati o ancora in coda".
 */
public record AuthorSummaryDTO(
        Long id,
        String nome,
        String cognome,
        String email,
        long numeroArticoli,
        StatoUtente stato,
        Double percentualeApprovazione
) {
}
