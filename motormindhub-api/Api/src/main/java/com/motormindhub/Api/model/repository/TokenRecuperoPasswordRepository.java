package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.TokenRecuperoPassword;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenRecuperoPasswordRepository extends JpaRepository<TokenRecuperoPassword, Long> {

    Optional<TokenRecuperoPassword> findByToken(String token);
}
