package com.motormindhub.Api.service.gestioneAutori.dto;

/** RF3.1 - i 5 aggregati (oggi/settimana/mese/anno/totale) delle letture per la dashboard Manager Autori. */
public record StatisticheLettureDTO(long oggi, long settimana, long mese, long anno, long totale) {
}
