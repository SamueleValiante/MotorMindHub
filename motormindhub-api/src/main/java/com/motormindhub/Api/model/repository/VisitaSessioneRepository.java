package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.VisitaSessione;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface VisitaSessioneRepository extends JpaRepository<VisitaSessione, Long> {

    boolean existsBySessioneId(String sessioneId);

    /**
     * Riclassificazione Guest -> Iscritto al login riuscito (RF3.1, UC_28): il WHERE su tipo = GUEST
     * rende l'operazione intrinsecamente idempotente (0 righe toccate se gia' ISCRITTO o se
     * sessioneId non esiste piu') senza bisogno di un caricamento preventivo dell'entita' - stesso
     * pattern bulk update di RefreshTokenRepository.revocaTuttiPerUtente.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE VisitaSessione v SET v.tipo = com.motormindhub.Api.model.entity.TipoVisitatore.ISCRITTO "
            + "WHERE v.sessioneId = :sessioneId AND v.tipo = com.motormindhub.Api.model.entity.TipoVisitatore.GUEST")
    int riclassificaComeIscritto(@Param("sessioneId") String sessioneId);

    /**
     * Tutti e 5 gli aggregati della dashboard Gestore Utenti (RF3.1, UC_28) in una sola scansione
     * indicizzata su data_visita (idx_visite_sessione_data_visita), invece di 5 query COUNT
     * separate - primo uso nel codebase di aggregazione condizionale (FILTER), le altre dashboard
     * (es. GestioneAmministrazioneUtenti.getUserManagementDashboard) compongono conteggi singoli
     * perche' non condividono la stessa tabella/scansione sottostante.
     */
    @Query(value = """
            SELECT
              COUNT(*) FILTER (WHERE data_visita >= :inizioGiorno)     AS oggi,
              COUNT(*) FILTER (WHERE data_visita >= :inizioSettimana)  AS settimana,
              COUNT(*) FILTER (WHERE data_visita >= :inizioMese)       AS mese,
              COUNT(*) FILTER (WHERE data_visita >= :inizioAnno)       AS anno,
              COUNT(*)                                                  AS totale
            FROM visite_sessione
            """, nativeQuery = true)
    ConteggioVisite aggregaConteggi(@Param("inizioGiorno") Instant inizioGiorno,
                                     @Param("inizioSettimana") Instant inizioSettimana,
                                     @Param("inizioMese") Instant inizioMese,
                                     @Param("inizioAnno") Instant inizioAnno);

    /**
     * Andamento giornaliero Guest/Iscritto per il grafico "Andamento visite" della dashboard
     * Gestore Utenti (RF3.1, UC_28): stessa scansione indicizzata su data_visita
     * (idx_visite_sessione_data_visita) di aggregaConteggi, raggruppata per giorno di calendario
     * invece che filtrata su una finestra fissa. Il giorno e' calcolato in fuso Europe/Rome (AT
     * TIME ZONE), coerente con ZONA_VISITE/confiniPeriodo - un bucket in UTC sposterebbe le visite
     * serali italiane sul giorno successivo. Solo i giorni con almeno una visita compaiono nel
     * risultato: lo zero-fill dei giorni senza dati e' responsabilita' del chiamante
     * (GestioneAmministrazioneUtenti.andamentoVisite), non della query.
     */
    @Query(value = """
            SELECT (data_visita AT TIME ZONE 'Europe/Rome')::date AS giorno,
                   COUNT(*) FILTER (WHERE tipo = 'GUEST')    AS guest,
                   COUNT(*) FILTER (WHERE tipo = 'ISCRITTO') AS iscritto
            FROM visite_sessione
            WHERE data_visita >= :da
            GROUP BY 1
            ORDER BY 1
            """, nativeQuery = true)
    List<AndamentoVisiteRiga> andamentoGiornaliero(@Param("da") Instant da);
}
