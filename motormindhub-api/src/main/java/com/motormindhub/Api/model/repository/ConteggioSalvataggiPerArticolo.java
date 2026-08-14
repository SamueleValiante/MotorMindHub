package com.motormindhub.Api.model.repository;

/** Proiezione per ArticoloSalvatoRepository.countByArticoloIdIn: evita di caricare gli ArticoloSalvato interi solo per contarli. */
public interface ConteggioSalvataggiPerArticolo {

    Long getArticoloId();

    long getConteggio();
}
