package com.motormindhub.Api.model.repository;

/** Proiezione per VisitaSessioneRepository.aggregaConteggi: i 5 aggregati calcolati in una sola scansione. */
public interface ConteggioVisite {

    long getOggi();

    long getSettimana();

    long getMese();

    long getAnno();

    long getTotale();
}
