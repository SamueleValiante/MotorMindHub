package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import java.time.LocalDate;

/** RF3.1, UC_28 - un punto della serie giornaliera Guest/Iscritto per il grafico "Andamento visite" della dashboard Gestore Utenti. */
public record PuntoAndamentoVisiteDTO(LocalDate data, long guest, long iscritto) {
}
