package com.motormindhub.Api.service.gestioneUtenti.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** RF1.6, UC_4. */
public record UpdateProfileDTO(
        @NotBlank(message = "Il campo 'Nome' e' obbligatorio e non puo' contenere caratteri speciali non validi.")
        @Size(max = 100)
        String nome,

        @NotBlank(message = "Il campo 'Cognome' e' obbligatorio e non puo' contenere caratteri speciali non validi.")
        @Size(max = 100)
        String cognome,

        String fotoProfilo,

        @Size(max = 1000, message = "La biografia ha superato il limite massimo di caratteri consentiti.")
        String biografia
) {
}
