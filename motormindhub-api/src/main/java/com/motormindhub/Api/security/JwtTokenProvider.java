package com.motormindhub.Api.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Emissione e validazione degli access token JWT (RNF2.7, RNF9.2). Il refresh token opaco e la sua
 * invalidazione esplicita al logout sono gestiti separatamente da RefreshTokenService: un JWT e'
 * stateless per natura (nessuna blocklist), quindi non e' il meccanismo giusto per un token che deve
 * poter essere revocato on-demand.
 */
@Component
public class JwtTokenProvider {

    private final SecretKey chiaveFirma;
    private final long durataMs;

    public JwtTokenProvider(@Value("${security.jwt.secret}") String secret,
                             @Value("${security.jwt.expiration-ms}") long durataMs) {
        this.chiaveFirma = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.durataMs = durataMs;
    }

    /**
     * "ruolo" e "stato" sono la fotografia dell'utente al momento dell'emissione: comodi lato
     * front-end per evitare una chiamata dedicata, ma NON una fonte affidabile di autorizzazione
     * per la durata del token, che resta stateless (nessuna blocklist) fino a scadenza naturale.
     */
    public String generateToken(UserPrincipal principal) {
        Date ora = new Date();
        Date scadenza = new Date(ora.getTime() + durataMs);

        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("uid", principal.getId())
                .claim("ruolo", principal.getRuolo().name())
                .claim("stato", principal.getStato().name())
                .issuedAt(ora)
                .expiration(scadenza)
                .signWith(chiaveFirma)
                .compact();
    }

    public boolean isTokenValido(String token) {
        try {
            Jwts.parser().verifyWith(chiaveFirma).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser().verifyWith(chiaveFirma).build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
}
