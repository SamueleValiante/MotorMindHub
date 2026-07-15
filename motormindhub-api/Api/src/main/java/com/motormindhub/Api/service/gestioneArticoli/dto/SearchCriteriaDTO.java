package com.motormindhub.Api.service.gestioneArticoli.dto;

import java.util.List;

/**
 * RF1.2 - ricerca full-text combinata con filtri di categoria. {@code categoriaIds} puo' contenere
 * la sola categoria padre selezionata dal dropdown "Categoria" e/o le sottocategorie selezionate
 * tramite i checkbox "Componente" (mockup 02_esplora_articoli.png): il service espande comunque
 * ogni id ricevuto con tutte le sue sottocategorie discendenti (RF1.2, "Categoria e relative
 * sottocategorie"), quindi selezionare solo il padre restituisce anche gli articoli dei suoi figli.
 */
public record SearchCriteriaDTO(
        String query,
        List<Long> categoriaIds,
        Integer pagina,
        Integer dimensionePagina,
        OrdinamentoArticoli ordinamento
) {
}
