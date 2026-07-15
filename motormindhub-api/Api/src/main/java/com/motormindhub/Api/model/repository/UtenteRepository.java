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

    /**
     * Ricerca per la "Gestione Account" del Gestore Utenti (RF4.2, UC_22, mockup
     * 39_gestore_gestione_account.png). Nessun filtro sul ruolo: RF4.2 richiede la lista completa
     * "degli utenti registrati", senza escludere Autori/Manager/Gestori (a differenza del Guest, mai
     * persistito - cfr. Ruolo).
     */
    @Query("""
            SELECT u FROM Utente u
            WHERE (:query IS NULL
                    OR LOWER(u.nome) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(u.cognome) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))
              AND (:stato IS NULL OR u.stato = :stato)
            ORDER BY u.dataRegistrazione DESC
            """)
    List<Utente> search(@Param("query") String query, @Param("stato") StatoUtente stato);
}
