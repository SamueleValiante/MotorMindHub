package com.motormindhub.Api.model.repository;

import java.time.LocalDate;

/** Proiezione per ArticoloRepository.andamentoPubblicazioniGiornaliero: un giorno con dati, prima dello zero-fill lato service. */
public interface AndamentoPubblicazioniRiga {

    LocalDate getGiorno();

    long getNumero();
}
