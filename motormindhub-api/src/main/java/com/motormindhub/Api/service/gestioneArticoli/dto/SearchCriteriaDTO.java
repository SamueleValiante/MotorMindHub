package com.motormindhub.Api.service.gestioneArticoli.dto;

import java.util.List;

/**
 * RF1.2 - ricerca full-text combinata con filtri di categoria. {@code categoriaIds} puo' contenere
 * la sola categoria padre selezionata dal dropdown "Categoria" e/o le sottocategorie selezionate
 * tramite i checkbox "Componente" (mockup 02_esplora_articoli.png): per default il service espande
 * comunque ogni id ricevuto con tutte le sue sottocategorie discendenti (RF1.2, "Categoria e
 * relative sottocategorie"), quindi selezionare solo il padre restituisce anche gli articoli dei
 * suoi figli.
 *
 * {@code espandiSottocategorie}: {@code null} o {@code true} (default, comportamento invariato,
 * TC11.2) mantiene l'espansione sopra descritta. {@code false} la disattiva esplicitamente:
 * {@code categoriaIds} viene usato cosi' com'e', match esatto sulla sola categoria indicata, nessun
 * discendente incluso. Introdotto per il drill-down di Esplora Articoli (CategoryDrilldownNav): a
 * differenza della ricerca generale/testuale, la navigazione ad albero mostra un livello alla
 * volta e deve riflettere esattamente il contenuto proprio del nodo selezionato, non l'aggregato
 * dell'intero ramo (altrimenti un nodo puramente organizzativo tipo "Meccanica" mostrerebbe gia'
 * gli articoli di "Freni" prima ancora di scendere li').
 */
public record SearchCriteriaDTO(
        String query,
        List<Long> categoriaIds,
        Integer pagina,
        Integer dimensionePagina,
        OrdinamentoArticoli ordinamento,
        Boolean espandiSottocategorie
) {
}
