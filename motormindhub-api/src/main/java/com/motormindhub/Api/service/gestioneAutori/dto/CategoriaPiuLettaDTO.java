package com.motormindhub.Api.service.gestioneAutori.dto;

/** RF3.1 - una categoria nella classifica "Categorie piu' lette" della dashboard Manager Autori, con le sottocategorie incluse nel totale. */
public record CategoriaPiuLettaDTO(Long categoriaId, String nome, long totaleVisualizzazioni) {
}
