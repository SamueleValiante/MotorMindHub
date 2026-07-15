package com.motormindhub.Api.service.gestioneArticoli.dto;

import com.motormindhub.Api.model.entity.TipoLista;

/** RF1.8, UC_7 - mockup 17_account_salvataggi.png (badge di stato lista per ogni card). */
public record SavedArticleDTO(
        ArticleSummaryDTO articolo,
        TipoLista tipoLista,
        String dataSalvataggio
) {
}
