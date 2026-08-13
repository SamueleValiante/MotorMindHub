package com.motormindhub.Api.model.repository;

/** Proiezione per ArticoloRepository.sommaVisualizzazioniPerCategoria: somma delle visualizzazioni degli articoli PUBBLICATO di ciascuna categoria (senza rollup delle sottocategorie, calcolato lato service). */
public interface SommaVisualizzazioniPerCategoriaRiga {

    Long getCategoriaId();

    long getTotale();
}
