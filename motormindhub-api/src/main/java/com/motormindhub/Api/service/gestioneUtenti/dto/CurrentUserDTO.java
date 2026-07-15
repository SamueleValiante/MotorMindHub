package com.motormindhub.Api.service.gestioneUtenti.dto;

import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;

import java.time.Instant;

/** Risposta di sola lettura per getCurrentUser - profilo dell'utente autenticato (self-service). */
public record CurrentUserDTO(
        String email,
        Ruolo ruolo,
        StatoUtente stato,
        Instant dataRegistrazione,
        String nome,
        String cognome,
        String fotoProfilo,
        String biografia
) {
}
