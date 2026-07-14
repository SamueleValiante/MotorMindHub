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
 * Emissione e validazione degli access token JWT (RNF2.7, RNF9.2). Il refresh token e il
 * meccanismo di invalidazione esplicita al logout sono demandati a un incremento successivo,
 * fuori dallo scope dei contratti OCL di GestioneUtenti (ODD 2.1).
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

    public String generateToken(UserPrincipal principal) {
        Date ora = new Date();
        Date scadenza = new Date(ora.getTime() + durataMs);

        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("uid", principal.getId())
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
