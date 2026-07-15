package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.RichiestaCancellazione;
import com.motormindhub.Api.model.entity.StatoRichiestaCancellazione;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RichiestaCancellazioneRepository extends JpaRepository<RichiestaCancellazione, Long> {

    boolean existsByUtenteIdAndStatoNot(Long utenteId, StatoRichiestaCancellazione stato);

    List<RichiestaCancellazione> findAllByOrderByDataRichiestaDesc();

    long countByStato(StatoRichiestaCancellazione stato);
}
