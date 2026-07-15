package com.motormindhub.Api.service.gestioneArticoli.dto;

import com.motormindhub.Api.model.entity.StatoArticolo;

/**
 * Vista "card" di un articolo (mockup 02_esplora_articoli.png, 22_autore_articoli.png): estratto e
 * tempo di lettura sono calcolati al volo dal testo, non persistiti.
 */
public record ArticleSummaryDTO(
        Long id,
        String titolo,
        String estratto,
        String immagineCopertina,
        Long categoriaId,
        String categoriaNome,
        Long autoreId,
        String autoreNome,
        StatoArticolo stato,
        int tempoLetturaMinuti,
        long numeroVisualizzazioni,
        String dataUltimoAggiornamento
) {
}
