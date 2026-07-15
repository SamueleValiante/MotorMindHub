package com.motormindhub.Api.service.gestioneArticoli.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * RF2.2, RF2.7, UC_15-UC_17. Titolo, testo e categoria sono volutamente nullable: una bozza puo'
 * essere salvata incompleta (mockup 23_autore_editor_nuovo.png: "Salva bozza" e' sempre
 * disponibile). La pre-condizione OCL di publishArticle e' l'unico punto in cui titolo e categoria
 * diventano obbligatori.
 */
public record ArticleDraftDTO(
        @Size(max = 300)
        String titolo,

        String testo,

        Long categoriaId,

        List<String> tag,

        String immagineCopertina
) {
}
