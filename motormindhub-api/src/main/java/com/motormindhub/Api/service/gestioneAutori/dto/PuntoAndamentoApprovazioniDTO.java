package com.motormindhub.Api.service.gestioneAutori.dto;

import java.time.LocalDate;

/** RF3.1 - un punto della serie giornaliera approvati/rifiutati per il grafico "Andamento approvazioni" della dashboard Manager Autori. */
public record PuntoAndamentoApprovazioniDTO(LocalDate data, long approvati, long rifiutati) {
}
