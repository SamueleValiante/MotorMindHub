package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneCategorie.deleteCategory (ODD 2.3) PRIMA della rimozione della riga
 * categoria (per non violare il vincolo di integrita' referenziale articoli.categoria_id).
 * Consumato sincronamente da GestioneArticoli.CategoriaEliminataListener per riassegnare gli
 * articoli "orfani" alla categoria di destinazione (RF3.5, UC_13), all'interno della stessa
 * transazione della cancellazione.
 */
public record CategoriaEliminataEvent(Long categoriaEliminataId, Long categoriaDestinazioneId) {
}
