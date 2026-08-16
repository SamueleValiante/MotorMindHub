package com.motormindhub.Api.service.gestioneAutori.dto;

import java.time.LocalDate;

/** RF3.1 - un punto della serie giornaliera di letture per il grafico "Andamento letture" della dashboard Manager Autori. */
public record PuntoAndamentoLettureDTO(LocalDate data, long numeroLetture) {
}
