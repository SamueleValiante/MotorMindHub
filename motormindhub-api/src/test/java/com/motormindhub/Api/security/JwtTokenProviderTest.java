package com.motormindhub.Api.security;

import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private static final String SECRET = "test-secret-key-almeno-256-bit-per-hmac-sha256-0123456789";

    private JwtTokenProvider jwtTokenProvider;
    private UserPrincipal userPrincipal;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(SECRET, 60_000L);

        Utente utente = new Utente("Marco", "Verdi", "marco@provider.it", "hash", null, null, true, null);
        ReflectionTestUtils.setField(utente, "id", 7L);
        utente.setStato(StatoUtente.ATTIVO);
        userPrincipal = new UserPrincipal(utente);
    }

    @Test
    void generateToken_produceTokenValidoConEmailCorretta() {
        String token = jwtTokenProvider.generateToken(userPrincipal);

        assertThat(jwtTokenProvider.isTokenValido(token)).isTrue();
        assertThat(jwtTokenProvider.getEmailFromToken(token)).isEqualTo("marco@provider.it");
    }

    @Test
    void isTokenValido_ritornaFalse_perTokenManomessoOMalformato() {
        String token = jwtTokenProvider.generateToken(userPrincipal);
        String tokenManomesso = token.substring(0, token.length() - 2) + "xx";

        assertThat(jwtTokenProvider.isTokenValido(tokenManomesso)).isFalse();
        assertThat(jwtTokenProvider.isTokenValido("non-e-un-jwt")).isFalse();
    }

    @Test
    void isTokenValido_ritornaFalse_perTokenScaduto() throws InterruptedException {
        JwtTokenProvider providerConScadenzaBreve = new JwtTokenProvider(SECRET, 1L);
        String token = providerConScadenzaBreve.generateToken(userPrincipal);

        Thread.sleep(50);

        assertThat(providerConScadenzaBreve.isTokenValido(token)).isFalse();
    }

    @Test
    void generateToken_includeRuoloEStatoComeClaimEsplicito() {
        Utente utente = new Utente("Laura", "Bianchi", "laura@provider.it", "hash", null, null, true, null);
        ReflectionTestUtils.setField(utente, "id", 9L);
        utente.setRuolo(Ruolo.MANAGER_AUTORI);
        utente.setStato(StatoUtente.SOSPESO);

        String token = jwtTokenProvider.generateToken(new UserPrincipal(utente));

        Claims claims = parseClaims(token);
        assertThat(claims.get("ruolo", String.class)).isEqualTo("MANAGER_AUTORI");
        assertThat(claims.get("stato", String.class)).isEqualTo("SOSPESO");
    }

    private Claims parseClaims(String token) {
        SecretKey chiave = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser().verifyWith(chiave).build().parseSignedClaims(token).getPayload();
    }
}
