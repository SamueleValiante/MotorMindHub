package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
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
     *
     * "query" e' sempre una stringa (mai null, cfr. GestioneAmministrazioneUtenti.searchUsers che
     * normalizza a "" prima di chiamare questo metodo): un parametro nullo dentro LOWER(...) non ha
     * un tipo SQL inferibile in modo affidabile da Hibernate/PostgreSQL in questo contesto (bindato
     * come bytea invece che text, "function lower(bytea) does not exist", 500 su ogni chiamata senza
     * query esplicita - riprodotto dal vivo). Una stringa vuota in LIKE '%%' combacia comunque con
     * tutto, quindi il ramo ":query IS NULL OR" non serve piu'.
     */
    @Query("""
            SELECT u FROM Utente u
            WHERE u.stato <> com.motormindhub.Api.model.entity.StatoUtente.CANCELLATO
              AND (LOWER(u.nome) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(u.cognome) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))
              AND (:stato IS NULL OR u.stato = :stato)
            ORDER BY u.dataRegistrazione DESC
            """)
    List<Utente> search(@Param("query") String query, @Param("stato") StatoUtente stato);

    /**
     * Andamento giornaliero delle nuove registrazioni (RF4.1) per la dashboard Gestore Utenti,
     * raggruppato in fuso Europe/Rome (coerente con VisitaSessioneRepository.andamentoGiornaliero).
     * Il filtro ruolo = ISCRITTO e' obbligatorio, non ridondante: GestioneAutori.acceptInvite (ODD
     * 2.4) inserisce righe Utente anche per gli inviti Autore accettati, con la stessa
     * dataRegistrazione valorizzata dal costruttore di Utente - senza il filtro, un'ondata di
     * inviti accettati dal Manager Autori gonfierebbe la crescita "organica" del pubblico che
     * questo grafico intende mostrare. Solo i giorni con almeno una registrazione compaiono: lo
     * zero-fill e' responsabilita' del chiamante (GestioneAmministrazioneUtenti.andamentoRegistrazioni).
     */
    @Query(value = """
            SELECT (data_registrazione AT TIME ZONE 'Europe/Rome')::date AS giorno,
                   COUNT(*) AS numero
            FROM utenti
            WHERE data_registrazione >= :da AND ruolo = 'ISCRITTO'
            GROUP BY 1
            ORDER BY 1
            """, nativeQuery = true)
    List<AndamentoRegistrazioniRiga> andamentoGiornaliero(@Param("da") Instant da);
}
