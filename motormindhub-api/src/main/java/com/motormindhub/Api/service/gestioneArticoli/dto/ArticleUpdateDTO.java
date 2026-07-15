package com.motormindhub.Api.service.gestioneArticoli.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * RF2.3, UC_20 - correzione di un articolo gia' pubblicato. A differenza di ArticleDraftDTO, qui
 * titolo, testo e categoria sono obbligatori: un articolo PUBBLICATO li possiede gia' tutti
 * (garantiti da publishArticle) e la modifica non deve poter violare l'invariante di sottosistema
 * "un articolo pubblicato appartiene sempre a una categoria" (ODD 2.2).
 */
public record ArticleUpdateDTO(
        @NotBlank
        @Size(max = 300)
        String titolo,

        @NotBlank
        String testo,

        @NotNull
        Long categoriaId,

        List<String> tag,

        String immagineCopertina
) {
}
