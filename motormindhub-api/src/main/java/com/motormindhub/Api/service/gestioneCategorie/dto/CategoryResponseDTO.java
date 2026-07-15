package com.motormindhub.Api.service.gestioneCategorie.dto;

/** Risposta di sola lettura per getCategoryById. */
public record CategoryResponseDTO(
        Long id,
        String nome,
        String descrizione,
        Long categoriaPadreId
) {
}
