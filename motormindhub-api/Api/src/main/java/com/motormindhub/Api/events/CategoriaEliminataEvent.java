package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneCategorie.deleteCategory (ODD 2.3) subito dopo la rimozione della
 * categoria. Consumato da GestioneArticoli (non ancora implementato) per riassegnare gli articoli
 * "orfani" alla categoria di destinazione (RF3.5, UC_13) - finche' GestioneArticoli non esiste
 * non ci sono Articolo persistiti, quindi il post-condition OCL e' banalmente soddisfatto.
 */
public record CategoriaEliminataEvent(Long categoriaEliminataId, Long categoriaDestinazioneId) {
}
