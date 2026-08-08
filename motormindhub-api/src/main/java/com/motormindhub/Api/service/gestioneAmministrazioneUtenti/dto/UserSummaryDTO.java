package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;

import java.time.Instant;

/** RF4.2, UC_22 - mockup 39_gestore_gestione_account.png. */
public record UserSummaryDTO(
        Long id,
        String nome,
        String cognome,
        String email,
        StatoUtente stato,
        Ruolo ruolo,
        Instant dataRegistrazione
) {
}
