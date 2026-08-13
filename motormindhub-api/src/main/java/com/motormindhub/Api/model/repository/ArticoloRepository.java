package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.Articolo;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.entity.StatoArticolo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ArticoloRepository extends JpaRepository<Articolo, Long> {

    /**
     * Ricerca full-text (SDD 3.3) sugli articoli PUBBLICATI: websearch_to_tsquery interpreta la
     * sintassi di ricerca "naturale" dell'utente (frasi tra virgolette, esclusioni con "-", ecc.).
     * Il filtro per categoria (RF1.2, "Categoria e relative sottocategorie") riceve gia' dal service
     * l'insieme completo di id (categoria selezionata + eventuali sottocategorie).
     */
    @Query(value = """
            SELECT a.* FROM articoli a
            WHERE a.stato = 'PUBBLICATO'
              AND (CAST(:query AS text) IS NULL OR a.search_vector @@ websearch_to_tsquery('italian', CAST(:query AS text)))
              AND (CAST(:categoriaIds AS bigint[]) IS NULL OR a.categoria_id = ANY (CAST(:categoriaIds AS bigint[])))
            """,
            countQuery = """
            SELECT count(*) FROM articoli a
            WHERE a.stato = 'PUBBLICATO'
              AND (CAST(:query AS text) IS NULL OR a.search_vector @@ websearch_to_tsquery('italian', CAST(:query AS text)))
              AND (CAST(:categoriaIds AS bigint[]) IS NULL OR a.categoria_id = ANY (CAST(:categoriaIds AS bigint[])))
            """,
            nativeQuery = true)
    Page<Articolo> cercaPubblicati(@Param("query") String query,
                                    @Param("categoriaIds") Long[] categoriaIds,
                                    Pageable pageable);

    List<Articolo> findByAutoreIdOrderByDataUltimoAggiornamentoDesc(Long autoreId);

    List<Articolo> findByStatoOrderByDataUltimoAggiornamentoDesc(StatoArticolo stato);

    long countByStato(StatoArticolo stato);

    long countByAutoreId(Long autoreId);

    /**
     * Conteggio aggregato per listAuthors (RF3.2, UC_8): una sola query invece di una countByAutoreId
     * per autore dentro un .map() (N+1 esplicito, non lazy-loading - trovato durante l'audit di
     * sicurezza sulla paginazione/N+1 di tutti gli endpoint che restituiscono liste).
     */
    @Query("SELECT a.autore.id AS autoreId, COUNT(a) AS conteggio FROM Articolo a WHERE a.autore.id IN :autoreIds GROUP BY a.autore.id")
    List<ConteggioArticoliPerAutore> countByAutoreIdIn(@Param("autoreIds") List<Long> autoreIds);

    boolean existsByAutoreIdAndStato(Long autoreId, StatoArticolo stato);

    void deleteByAutoreId(Long autoreId);

    /**
     * Riassegnazione massiva degli articoli orfani a seguito dell'eliminazione di una categoria
     * (RF3.5, UC_13) - invocata da CategoriaEliminataListener. Un bulk update evita di caricare in
     * memoria (ed emettere un UPDATE per ciascuno) un numero potenzialmente elevato di articoli.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Articolo a SET a.categoria = :destinazione WHERE a.categoria.id = :categoriaEliminataId")
    int riassegnaCategoria(@Param("categoriaEliminataId") Long categoriaEliminataId,
                            @Param("destinazione") Categoria destinazione);

    /**
     * Conteggio aggregato per stato per listAuthors (RF3.2, percentualeApprovazione): stesso motivo
     * anti-N+1 di countByAutoreIdIn. Filtrato alle tre fasi del ciclo di vita "sottomesso" (esclude
     * BOZZA, mai inviata in approvazione) per coerenza col denominatore di percentualeApprovazione.
     */
    @Query("SELECT a.autore.id AS autoreId, a.stato AS stato, COUNT(a) AS conteggio FROM Articolo a "
            + "WHERE a.autore.id IN :autoreIds AND a.stato IN (com.motormindhub.Api.model.entity.StatoArticolo.IN_ATTESA_APPROVAZIONE, "
            + "com.motormindhub.Api.model.entity.StatoArticolo.PUBBLICATO, com.motormindhub.Api.model.entity.StatoArticolo.RIFIUTATO) "
            + "GROUP BY a.autore.id, a.stato")
    List<ConteggioArticoliPerAutoreEStato> countByAutoreIdInGroupByStato(@Param("autoreIds") List<Long> autoreIds);

    /**
     * Andamento giornaliero delle pubblicazioni (ODD 2.4, RF3.1) per la dashboard Manager Autori,
     * bucket su data_decisione (non data_creazione ne' data_ultimo_aggiornamento: cfr. Articolo.approva)
     * in fuso Europe/Rome, stesso pattern di UtenteRepository.andamentoGiornaliero. Solo i giorni con
     * almeno una pubblicazione compaiono: lo zero-fill e' responsabilita' del chiamante
     * (GestioneAutori.andamentoPubblicazioni).
     */
    @Query(value = """
            SELECT (data_decisione AT TIME ZONE 'Europe/Rome')::date AS giorno,
                   COUNT(*) AS numero
            FROM articoli
            WHERE data_decisione >= :da AND stato = 'PUBBLICATO'
            GROUP BY 1
            ORDER BY 1
            """, nativeQuery = true)
    List<AndamentoPubblicazioniRiga> andamentoPubblicazioniGiornaliero(@Param("da") Instant da);

    /**
     * Andamento giornaliero approvati/rifiutati (ODD 2.4, RF3.1) per la dashboard Manager Autori,
     * stesso bucket su data_decisione di andamentoPubblicazioniGiornaliero, con le due serie calcolate
     * in un'unica scansione via COUNT FILTER (stesso pattern di VisitaSessioneRepository.andamentoGiornaliero).
     * Zero-fill lato chiamante (GestioneAutori.andamentoApprovazioni).
     */
    @Query(value = """
            SELECT (data_decisione AT TIME ZONE 'Europe/Rome')::date AS giorno,
                   COUNT(*) FILTER (WHERE stato = 'PUBBLICATO') AS approvati,
                   COUNT(*) FILTER (WHERE stato = 'RIFIUTATO')  AS rifiutati
            FROM articoli
            WHERE data_decisione >= :da AND stato IN ('PUBBLICATO', 'RIFIUTATO')
            GROUP BY 1
            ORDER BY 1
            """, nativeQuery = true)
    List<AndamentoApprovazioniRiga> andamentoApprovazioniGiornaliero(@Param("da") Instant da);

    /**
     * Somma delle visualizzazioni per categoria (ODD 2.4, RF3.1) tra gli articoli PUBBLICATO - solo
     * il totale proprio di ciascuna categoria, senza includere le sottocategorie: il rollup
     * gerarchico (stessa espansione ad albero di GestioneArticoli.espandiConSottocategorie) e'
     * calcolato lato service (GestioneAutori.getCategoriePiuLette), non qui.
     */
    @Query(value = """
            SELECT categoria_id AS categoriaId, SUM(numero_visualizzazioni) AS totale
            FROM articoli
            WHERE stato = 'PUBBLICATO' AND categoria_id IS NOT NULL
            GROUP BY categoria_id
            """, nativeQuery = true)
    List<SommaVisualizzazioniPerCategoriaRiga> sommaVisualizzazioniPerCategoria();
}
