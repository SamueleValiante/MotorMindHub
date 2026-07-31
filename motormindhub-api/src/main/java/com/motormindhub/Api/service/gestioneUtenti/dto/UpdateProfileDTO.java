package com.motormindhub.Api.service.gestioneUtenti.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

/** RF1.6, UC_4. */
public record UpdateProfileDTO(
        @NotBlank(message = "Il campo 'Nome' e' obbligatorio e non puo' contenere caratteri speciali non validi.")
        @Size(max = 100)
        String nome,

        @NotBlank(message = "Il campo 'Cognome' e' obbligatorio e non puo' contenere caratteri speciali non validi.")
        @Size(max = 100)
        String cognome,

        // Popolato con l'URL restituito da POST /utenti/me/foto-profilo (SDD 3.2), non piu' testo
        // libero lato front-end - @Size allineato a VARCHAR(2048) (V1__create_utenti_table.sql).
        @Size(max = 2048)
        @URL
        String fotoProfilo,

        @Size(max = 1000, message = "La biografia ha superato il limite massimo di caratteri consentiti.")
        String biografia
) {
}
