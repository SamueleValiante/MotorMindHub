package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.ArticoloSalvato;
import com.motormindhub.Api.model.entity.TipoLista;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArticoloSalvatoRepository extends JpaRepository<ArticoloSalvato, Long> {

    boolean existsByUtenteIdAndArticoloIdAndTipoLista(Long utenteId, Long articoloId, TipoLista tipoLista);

    Optional<ArticoloSalvato> findByUtenteIdAndArticoloIdAndTipoLista(Long utenteId, Long articoloId, TipoLista tipoLista);

    List<ArticoloSalvato> findByUtenteIdOrderByDataSalvataggioDesc(Long utenteId);
}
