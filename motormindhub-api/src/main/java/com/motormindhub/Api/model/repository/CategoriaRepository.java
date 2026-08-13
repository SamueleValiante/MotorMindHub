package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    /**
     * Verifica l'invariante di unicita' "nome" tra categorie sorelle (stesso categoriaPadre).
     * Query esplicita (anziche' un metodo derivato) perche' categoriaPadreId puo' essere null per
     * le categorie radice, e "=" su un parametro null non intercetterebbe le righe con
     * categoria_padre_id IS NULL.
     */
    @Query("""
            SELECT COUNT(c) > 0 FROM Categoria c
            WHERE c.nome = :nome
            AND ((:categoriaPadreId IS NULL AND c.categoriaPadre IS NULL)
                 OR c.categoriaPadre.id = :categoriaPadreId)
            """)
    boolean existsByNomeAndCategoriaPadreId(@Param("nome") String nome,
                                             @Param("categoriaPadreId") Long categoriaPadreId);

    boolean existsByCategoriaPadreId(Long categoriaPadreId);

    /**
     * Andamento giornaliero delle nuove categorie (ODD 2.4, RF3.1) per la dashboard Manager Autori,
     * bucket in fuso Europe/Rome, stesso pattern di UtenteRepository.andamentoGiornaliero. Solo i
     * giorni con almeno una categoria creata compaiono: lo zero-fill e' responsabilita' del
     * chiamante (GestioneAutori.andamentoCategorie).
     */
    @Query(value = """
            SELECT (data_creazione AT TIME ZONE 'Europe/Rome')::date AS giorno,
                   COUNT(*) AS numero
            FROM categorie
            WHERE data_creazione >= :da
            GROUP BY 1
            ORDER BY 1
            """, nativeQuery = true)
    List<AndamentoCategorieRiga> andamentoGiornaliero(@Param("da") Instant da);
}
