package com.motormindhub.Api.model.repository;

import java.time.LocalDate;

/** Proiezione per UtenteRepository.andamentoGiornaliero: un giorno con dati, prima dello zero-fill lato service. */
public interface AndamentoRegistrazioniRiga {

    LocalDate getGiorno();

    long getNumero();
}
