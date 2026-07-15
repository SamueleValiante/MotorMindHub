package com.motormindhub.Api.service.gestioneCategorie.dto;

import java.util.List;

/** Nodo dell'albero gerarchico restituito da getCategoryTree (RF1.2). */
public record CategoryTreeNodeDTO(
        Long id,
        String nome,
        String descrizione,
        List<CategoryTreeNodeDTO> figlie
) {
}
