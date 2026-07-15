package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
