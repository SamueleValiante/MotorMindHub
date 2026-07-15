package com.motormindhub.Api.service.gestioneArticoli.dto;

import java.util.List;

public record ArticleSearchResultDTO(
        List<ArticleSummaryDTO> articoli,
        long totaleRisultati,
        int pagina,
        int dimensionePagina
) {
}
