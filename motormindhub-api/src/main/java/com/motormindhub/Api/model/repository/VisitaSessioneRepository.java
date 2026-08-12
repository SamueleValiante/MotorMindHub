package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.VisitaSessione;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface VisitaSessioneRepository extends JpaRepository<VisitaSessione, Long> {

    boolean existsBySessioneId(String sessioneId);

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
}
