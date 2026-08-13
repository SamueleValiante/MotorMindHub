package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.StatoArticolo;

/** Proiezione per ArticoloRepository.countByAutoreIdInGroupByStato: usata da GestioneAutori.listAuthors per calcolare percentualeApprovazione. */
public interface ConteggioArticoliPerAutoreEStato {

    Long getAutoreId();

    StatoArticolo getStato();

    long getConteggio();
}
