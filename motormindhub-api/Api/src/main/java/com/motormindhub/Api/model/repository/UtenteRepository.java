package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UtenteRepository extends JpaRepository<Utente, Long> {

    Optional<Utente> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Utente> findByTokenVerifica(String tokenVerifica);

    List<Utente> findByRuolo(Ruolo ruolo);

    long countByRuoloAndStato(Ruolo ruolo, StatoUtente stato);
}
