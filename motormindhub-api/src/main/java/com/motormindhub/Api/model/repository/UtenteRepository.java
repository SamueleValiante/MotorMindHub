package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UtenteRepository extends JpaRepository<Utente, Long> {

    Optional<Utente> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Utente> findByTokenVerifica(String tokenVerifica);

    Optional<Utente> findByTokenSblocco(String tokenSblocco);

    List<Utente> findByRuolo(Ruolo ruolo);

    long countByRuoloAndStato(Ruolo ruolo, StatoUtente stato);

    /** RF4.1 - "numero di utenti registrati" della dashboard: esclude i tombstone CANCELLATO (StatoUtente). */
    long countByStatoNot(StatoUtente stato);

    /**
     * Ricerca per la "Gestione Account" del Gestore Utenti (RF4.2, UC_22, mockup
     * 39_gestore_gestione_account.png). Nessun filtro sul ruolo: RF4.2 richiede la lista completa
     * "degli utenti registrati", senza escludere Autori/Manager/Gestori (a differenza del Guest, mai
     * persistito - cfr. Ruolo). L'esclusione di CANCELLATO e' incondizionata (non solo quando :stato
     * e' null): un account anonimizzato da processAccountDeletion (ODD 2.5) non e' piu' un "utente
     * registrato" nel senso di RF4.2 - RF4.2 stessa elenca solo tre stati visualizzabili (attivo,
     * sospeso, in cancellazione), CANCELLATO non compare tra questi.
     */
    @Query("""
            SELECT u FROM Utente u
            WHERE u.stato <> com.motormindhub.Api.model.entity.StatoUtente.CANCELLATO
              AND (:query IS NULL
                    OR LOWER(u.nome) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(u.cognome) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))
              AND (:stato IS NULL OR u.stato = :stato)
            ORDER BY u.dataRegistrazione DESC
            """)
    List<Utente> search(@Param("query") String query, @Param("stato") StatoUtente stato);
}
