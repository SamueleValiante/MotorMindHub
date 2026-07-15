package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.Segnalazione;
import com.motormindhub.Api.model.entity.StatoSegnalazione;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SegnalazioneRepository extends JpaRepository<Segnalazione, Long> {

    List<Segnalazione> findAllByOrderByDataCreazioneDesc();

    long countByStato(StatoSegnalazione stato);
}
