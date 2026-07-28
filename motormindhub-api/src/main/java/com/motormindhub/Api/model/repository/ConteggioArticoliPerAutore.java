package com.motormindhub.Api.model.repository;

/** Proiezione per ArticoloRepository.countByAutoreIdIn: evita di caricare gli Articoli interi solo per contarli. */
public interface ConteggioArticoliPerAutore {

    Long getAutoreId();

    long getConteggio();
}
