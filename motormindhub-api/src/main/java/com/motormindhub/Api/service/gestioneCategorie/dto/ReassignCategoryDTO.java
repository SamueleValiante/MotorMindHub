package com.motormindhub.Api.service.gestioneCategorie.dto;

import jakarta.validation.constraints.NotNull;

/** RF3.5, UC_13 - categoria a cui riassegnare gli articoli orfani durante l'eliminazione. */
public record ReassignCategoryDTO(
        @NotNull
        Long categoriaDestinazioneId
) {
}
