package com.motormindhub.Api.service.gestioneAutori.dto;

import jakarta.validation.constraints.NotBlank;

/** RF3.6, UC_21 - mockup 37_manager_approvazione_dettaglio.png ("MOTIVAZIONE (SE RIFIUTO)"). */
public record RejectionReasonDTO(
        @NotBlank(message = "E' necessario indicare una motivazione per il rifiuto.")
        String motivazione
) {
}
