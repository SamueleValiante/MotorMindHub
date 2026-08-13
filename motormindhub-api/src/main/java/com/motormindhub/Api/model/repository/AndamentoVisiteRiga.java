package com.motormindhub.Api.model.repository;

import java.time.LocalDate;

/** Proiezione per VisitaSessioneRepository.andamentoGiornaliero: un giorno con dati, prima dello zero-fill lato service. */
public interface AndamentoVisiteRiga {

    LocalDate getGiorno();

    long getGuest();

    long getIscritto();
}
