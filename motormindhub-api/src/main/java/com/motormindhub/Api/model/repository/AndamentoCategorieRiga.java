package com.motormindhub.Api.model.repository;

import java.time.LocalDate;

/** Proiezione per CategoriaRepository.andamentoGiornaliero: un giorno con dati, prima dello zero-fill lato service. */
public interface AndamentoCategorieRiga {

    LocalDate getGiorno();

    long getNumero();
}
