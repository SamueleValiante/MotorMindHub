package com.motormindhub.Api.service.gestioneAutori.dto;

import java.time.LocalDate;

/** RF3.1 - un punto della serie giornaliera di nuove categorie per il grafico "Andamento categorie" della dashboard Manager Autori. */
public record PuntoAndamentoCategorieDTO(LocalDate data, long numeroCategorie) {
}
