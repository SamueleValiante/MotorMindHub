package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.ArticoloSalvato;
import com.motormindhub.Api.model.entity.TipoLista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ArticoloSalvatoRepository extends JpaRepository<ArticoloSalvato, Long> {

    boolean existsByUtenteIdAndArticoloIdAndTipoLista(Long utenteId, Long articoloId, TipoLista tipoLista);

    Optional<ArticoloSalvato> findByUtenteIdAndArticoloIdAndTipoLista(Long utenteId, Long articoloId, TipoLista tipoLista);

    List<ArticoloSalvato> findByUtenteIdOrderByDataSalvataggioDesc(Long utenteId);

    void deleteByArticoloId(Long articoloId);

    /**
     * Conteggio aggregato per getArticlesByAuthor ("I Miei Articoli", numeroSalvataggi): una sola
     * query invece di una countByArticoloId per articolo dentro il .map() - stesso pattern anti-N+1
     * di ArticoloRepository.countByAutoreIdIn. Nessun filtro su tipoLista: Preferiti e Leggi piu'
     * tardi confluiscono in un unico totale, come richiesto dalla dashboard Autore.
     */
    @Query("SELECT s.articolo.id AS articoloId, COUNT(s) AS conteggio FROM ArticoloSalvato s WHERE s.articolo.id IN :articoloIds GROUP BY s.articolo.id")
    List<ConteggioSalvataggiPerArticolo> countByArticoloIdIn(@Param("articoloIds") List<Long> articoloIds);
}
