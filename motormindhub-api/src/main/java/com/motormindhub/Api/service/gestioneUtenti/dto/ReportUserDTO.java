package com.motormindhub.Api.service.gestioneUtenti.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** RF1.9, UC_26. */
public record ReportUserDTO(
        @NotNull
        Long segnalatoId,

        @NotBlank(message = "E' necessario indicare una motivazione per la segnalazione.")
        String motivazione
) {
}
