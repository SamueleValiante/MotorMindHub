package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import java.time.LocalDate;

/** RF4.1 - un punto della serie giornaliera di nuove registrazioni (solo ruolo ISCRITTO) per la dashboard Gestore Utenti. */
public record PuntoAndamentoRegistrazioniDTO(LocalDate data, long numeroRegistrazioni) {
}
