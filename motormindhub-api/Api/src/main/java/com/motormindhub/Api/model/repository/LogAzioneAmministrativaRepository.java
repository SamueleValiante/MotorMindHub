package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.LogAzioneAmministrativa;
import com.motormindhub.Api.model.entity.TipoAzioneAmministrativa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LogAzioneAmministrativaRepository extends JpaRepository<LogAzioneAmministrativa, Long> {

    @Query("""
            SELECT l FROM LogAzioneAmministrativa l
            WHERE (:tipoAzione IS NULL OR l.tipoAzione = :tipoAzione)
            ORDER BY l.dataAzione DESC
            """)
    List<LogAzioneAmministrativa> findByFiltro(@Param("tipoAzione") TipoAzioneAmministrativa tipoAzione);
}
