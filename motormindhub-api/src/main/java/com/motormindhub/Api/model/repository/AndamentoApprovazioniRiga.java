package com.motormindhub.Api.model.repository;

import java.time.LocalDate;

/** Proiezione per ArticoloRepository.andamentoApprovazioniGiornaliero: un giorno con dati, prima dello zero-fill lato service. */
public interface AndamentoApprovazioniRiga {

    LocalDate getGiorno();

    long getApprovati();

    long getRifiutati();
}
