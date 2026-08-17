package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.VisualizzazioneArticolo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface VisualizzazioneArticoloRepository extends JpaRepository<VisualizzazioneArticolo, Long> {

    /**
     * Cleanup esplicito invocato da GestioneArticoli.deleteArticle (ODD 2.2), stesso motivo/pattern
     * di ArticoloSalvatoRepository.deleteByArticoloId: articolo_id non ha ON DELETE CASCADE (scelta
     * deliberata del progetto), quindi senza questa chiamata la cancellazione di un articolo con
     * letture registrate fallirebbe con una violazione di integrità referenziale.
     */
    void deleteByArticoloId(Long articoloId);

    /**
     * Andamento giornaliero delle letture (ODD 2.4, RF3.1) per il grafico "Andamento letture" della
     * dashboard Manager Autori, bucket in fuso Europe/Rome, stesso pattern di
     * UtenteRepository.andamentoGiornaliero. Solo i giorni con almeno una lettura compaiono: lo
     * zero-fill è responsabilità del chiamante (GestioneAutori.andamentoLetture).
     */
    @Query(value = """
            SELECT (data_lettura AT TIME ZONE 'Europe/Rome')::date AS giorno,
                   COUNT(*) AS numero
            FROM visualizzazioni_articolo
            WHERE data_lettura >= :da
            GROUP BY 1
            ORDER BY 1
            """, nativeQuery = true)
    List<AndamentoLettureRiga> andamentoGiornaliero(@Param("da") Instant da);

    /**
     * Tutti e 5 gli aggregati della dashboard Manager Autori (RF3.1) in una sola scansione
     * indicizzata su data_lettura (idx_visualizzazioni_articolo_data_lettura), invece di 5 query
     * COUNT separate - stesso pattern di VisitaSessioneRepository.aggregaConteggi (§2.5).
     */
    @Query(value = """
            SELECT
              COUNT(*) FILTER (WHERE data_lettura >= :inizioGiorno)     AS oggi,
              COUNT(*) FILTER (WHERE data_lettura >= :inizioSettimana)  AS settimana,
              COUNT(*) FILTER (WHERE data_lettura >= :inizioMese)       AS mese,
              COUNT(*) FILTER (WHERE data_lettura >= :inizioAnno)       AS anno,
              COUNT(*)                                                   AS totale
            FROM visualizzazioni_articolo
            """, nativeQuery = true)
    ConteggioLetture aggregaConteggi(@Param("inizioGiorno") Instant inizioGiorno,
                                      @Param("inizioSettimana") Instant inizioSettimana,
                                      @Param("inizioMese") Instant inizioMese,
                                      @Param("inizioAnno") Instant inizioAnno);
}
