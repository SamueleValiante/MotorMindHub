package com.motormindhub.Api.service.gestioneArticoli.dto;

/**
 * RF2.1 - mockup 22_autore_articoli.png ("I Miei Articoli"). Estende ArticleSummaryDTO (che espone
 * gia' numeroVisualizzazioni) con numeroSalvataggi - deliberatamente un DTO separato invece di un
 * campo aggiunto direttamente ad ArticleSummaryDTO, che e' condiviso anche con searchArticles
 * (Esplora articoli, pubblico) e getSavedArticles: calcolare i salvataggi per ogni risultato di
 * ricerca pubblico sarebbe un costo non richiesto fuori dalla pagina dell'Autore proprietario.
 */
public record AuthorArticleSummaryDTO(
        ArticleSummaryDTO articolo,
        long numeroSalvataggi
) {
}
