package com.motormindhub.Api.service.gestioneUtenti.dto;

/** Risposta di sola lettura per getPublicProfile (RF1.9) - nessun dato sensibile esposto. */
public record PublicProfileDTO(
        Long id,
        String nome,
        String cognome,
        String fotoProfilo,
        String biografia
) {
}
