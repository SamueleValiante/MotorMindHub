package com.motormindhub.Api.model.repository;

import com.motormindhub.Api.model.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * Revoca l'intera famiglia di refresh token attivi di un utente (RefreshTokenService.rotate,
     * rilevamento del riuso) - bulk update, stesso pattern di ArticoloRepository.riassegnaCategoria:
     * evita di caricare in memoria (ed emettere un UPDATE per ciascuno) un numero potenzialmente
     * elevato di sessioni attive.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RefreshToken r SET r.revocato = true WHERE r.utente.id = :utenteId AND r.revocato = false")
    int revocaTuttiPerUtente(@Param("utenteId") Long utenteId);
}
