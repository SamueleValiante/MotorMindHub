package com.motormindhub.Api.model.repository;

/** Proiezione per VisualizzazioneArticoloRepository.aggregaConteggi: i 5 aggregati calcolati in una sola scansione. */
public interface ConteggioLetture {

    long getOggi();

    long getSettimana();

    long getMese();

    long getAnno();

    long getTotale();
}
