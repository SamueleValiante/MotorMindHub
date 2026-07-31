package com.motormindhub.Api.service.gestioneArticoli.dto;

import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

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

        // Popolato con l'URL restituito da POST /articoli/copertine (SDD 3.2): l'upload sostituisce
        // il campo URL libero che l'editor esponeva finora (non coesistono, altrimenti un autore
        // potrebbe aggirare le validazioni di ImageUploadValidator incollando un link diretto).
        @Size(max = 2048)
        @URL
        String immagineCopertina
) {
}
