package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.InvitoAutore;
import com.motormindhub.Api.model.entity.StatoInvito;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvitoAutoreRepository extends JpaRepository<InvitoAutore, Long> {

    Optional<InvitoAutore> findByToken(String token);

    boolean existsByEmailAndStato(String email, StatoInvito stato);
}
