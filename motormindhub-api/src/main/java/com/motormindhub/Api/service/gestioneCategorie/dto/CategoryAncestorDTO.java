package com.motormindhub.Api.service.gestioneCategorie.dto;

/** Un segmento della catena di antenati restituita da getCategoryPath (radice -> foglia). */
public record CategoryAncestorDTO(
        Long id,
        String nome
) {
}
