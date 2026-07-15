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
              AND (:query IS NULL OR a.search_vector @@ websearch_to_tsquery('italian', :query))
              AND (:categoriaIds IS NULL OR a.categoria_id = ANY (:categoriaIds))
            """,
            countQuery = """
            SELECT count(*) FROM articoli a
            WHERE a.stato = 'PUBBLICATO'
              AND (:query IS NULL OR a.search_vector @@ websearch_to_tsquery('italian', :query))
              AND (:categoriaIds IS NULL OR a.categoria_id = ANY (:categoriaIds))
            """,
            nativeQuery = true)
    Page<Articolo> cercaPubblicati(@Param("query") String query,
                                    @Param("categoriaIds") List<Long> categoriaIds,
                                    Pageable pageable);

    List<Articolo> findByAutoreIdOrderByDataUltimoAggiornamentoDesc(Long autoreId);

    List<Articolo> findByStatoOrderByDataUltimoAggiornamentoDesc(StatoArticolo stato);

    long countByStato(StatoArticolo stato);

    long countByAutoreId(Long autoreId);

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
}
