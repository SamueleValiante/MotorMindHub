package com.motormindhub.Api.service.gestioneCategorie.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * RF2.5, RF2.6, UC_12, UC_14. Condiviso tra createCategory e updateCategory (ODD 2.3, SDD 4.3):
 * in updateCategory pero' solo {@code descrizione} viene applicata all'entita' - nome e
 * categoriaPadreId sono immutabili dopo la creazione (vedi {@link com.motormindhub.Api.model.entity.Categoria}).
 */
public record CategoryDTO(
        @NotBlank(message = "Il campo 'Nome' e' obbligatorio e non puo' contenere caratteri speciali non validi.")
        @Size(max = 150)
        String nome,

        Long categoriaPadreId,

        @Size(max = 2000)
        String descrizione
) {
}
