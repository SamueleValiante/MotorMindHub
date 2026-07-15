package com.motormindhub.Api.service.gestioneAutori.dto;

import jakarta.validation.constraints.NotNull;

/** RF3.4, UC_11 - mockup 32 (popup rimuovi autore, non correttamente esportato: vedi RF3.4 per il testo). */
public record RemoveAuthorPolicyDTO(
        @NotNull
        Boolean mantieniArticoli
) {
}
