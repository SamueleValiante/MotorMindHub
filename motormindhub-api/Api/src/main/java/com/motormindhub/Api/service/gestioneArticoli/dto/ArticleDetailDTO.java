package com.motormindhub.Api.service.gestioneArticoli.dto;

import com.motormindhub.Api.model.entity.StatoArticolo;

import java.util.List;

/** Vista di dettaglio (mockup 03_dettaglio_articolo.png). */
public record ArticleDetailDTO(
        Long id,
        String titolo,
        String testo,
        String immagineCopertina,
        List<String> tag,
        Long categoriaId,
        String categoriaNome,
        Long autoreId,
        String autoreNome,
        StatoArticolo stato,
        int tempoLetturaMinuti,
        long numeroVisualizzazioni,
        String dataCreazione,
        String dataUltimoAggiornamento
) {
}
