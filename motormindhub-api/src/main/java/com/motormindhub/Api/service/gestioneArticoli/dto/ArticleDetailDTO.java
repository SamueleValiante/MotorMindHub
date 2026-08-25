package com.motormindhub.Api.service.gestioneArticoli.dto;

import com.motormindhub.Api.model.entity.StatoArticolo;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryAncestorDTO;

import java.util.List;

/** Vista di dettaglio (mockup 03_dettaglio_articolo.png). */
public record ArticleDetailDTO(
        Long id,
        String titolo,
        String testo,
        String immagineCopertina,
        List<String> tag,
        Long categoriaId,
        String categoriaNome,
        /** Catena radice -> foglia della categoria (GestioneCategorie.getCategoryPath), per il
         *  breadcrumb del Dettaglio Articolo. Vuota se l'articolo non ha categoria. */
        List<CategoryAncestorDTO> categoriaAntenati,
        Long autoreId,
        String autoreNome,
        StatoArticolo stato,
        int tempoLetturaMinuti,
        long numeroVisualizzazioni,
        String dataCreazione,
        String dataUltimoAggiornamento,
        /** Valorizzato solo quando stato = RIFIUTATO (cfr. Articolo.rifiuta). Null altrimenti. */
        String motivazioneRifiuto
) {
}
