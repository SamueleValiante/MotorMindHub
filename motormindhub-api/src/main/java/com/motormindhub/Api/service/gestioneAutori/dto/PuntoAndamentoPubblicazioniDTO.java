package com.motormindhub.Api.service.gestioneAutori.dto;

import java.time.LocalDate;

/** RF3.1 - un punto della serie giornaliera di pubblicazioni per il grafico "Andamento pubblicazioni" della dashboard Manager Autori. */
public record PuntoAndamentoPubblicazioniDTO(LocalDate data, long numeroPubblicazioni) {
}
