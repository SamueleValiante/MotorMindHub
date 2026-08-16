package com.motormindhub.Api.model.repository;

import java.time.LocalDate;

/** Proiezione per VisualizzazioneArticoloRepository.andamentoGiornaliero: un giorno con dati, prima dello zero-fill lato service. */
public interface AndamentoLettureRiga {

    LocalDate getGiorno();

    long getNumero();
}
