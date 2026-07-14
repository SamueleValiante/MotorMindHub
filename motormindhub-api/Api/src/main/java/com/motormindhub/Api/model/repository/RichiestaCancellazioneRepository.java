package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.RichiestaCancellazione;
import com.motormindhub.Api.model.entity.StatoRichiestaCancellazione;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RichiestaCancellazioneRepository extends JpaRepository<RichiestaCancellazione, Long> {

    boolean existsByUtenteIdAndStatoNot(Long utenteId, StatoRichiestaCancellazione stato);
}
