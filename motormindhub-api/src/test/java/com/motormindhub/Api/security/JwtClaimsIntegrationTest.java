package com.motormindhub.Api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import com.motormindhub.Api.web.auth.RefreshTokenRequestDTO;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB reale, filter chain reale) dei claim "ruolo"/"stato"
 * introdotti in JwtTokenProvider.generateToken: JwtTokenProviderTest verifica gia' il metodo in
 * isolamento, ma qui si verifica che i due endpoint HTTP che lo invocano (login e refresh -
 * AuthController) restituiscano davvero un access token con quei claim, decodificato come farebbe
 * un client reale (stessa chiave configurata via security.jwt.secret), non un token costruito ad hoc
 * nel test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class JwtClaimsIntegrationTest {

    private static final String EMAIL = "jwt-claims-test@provider.it";
    private static final String PASSWORD = "PasswordCorretta78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Value("${security.jwt.secret}")
    private String jwtSecret;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void creaUtenteAttivo() {
        Utente utente = new Utente("Claim", "Test", EMAIL, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(Ruolo.AUTORE);
        utenteRepository.saveAndFlush(utente);
    }

    private Claims decodifica(String accessToken) {
        SecretKey chiave = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser().verifyWith(chiave).build().parseSignedClaims(accessToken).getPayload();
    }

    @Test
    void login_emetteAccessTokenConClaimRuoloEStato() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        String accessToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();

        Claims claims = decodifica(accessToken);
        assertThat(claims.getSubject()).isEqualTo(EMAIL);
        assertThat(claims.get("ruolo", String.class)).isEqualTo("AUTORE");
        assertThat(claims.get("stato", String.class)).isEqualTo("ATTIVO");
    }

    @Test
    void refresh_emetteNuovoAccessTokenConClaimRuoloEStatoAggiornati() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        String refreshToken = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("refreshToken").asText();

        // Il ruolo cambia tra il login e il refresh (es. promozione ad Autore avvenuta nel
        // frattempo): il nuovo access token deve riflettere lo stato corrente, non quello
        // fotografato al login, perche' AuthController.refresh ricarica l'Utente dal DB
        // (RefreshTokenService.rotate) prima di generare il nuovo token.
        Utente utente = utenteRepository.findByEmail(EMAIL).orElseThrow();
        utente.setRuolo(Ruolo.MANAGER_AUTORI);
        utenteRepository.saveAndFlush(utente);

        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO(refreshToken))))
                .andExpect(status().isOk())
                .andReturn();
        String nuovoAccessToken = objectMapper.readTree(refreshResult.getResponse().getContentAsString()).get("accessToken").asText();

        Claims claims = decodifica(nuovoAccessToken);
        assertThat(claims.getSubject()).isEqualTo(EMAIL);
        assertThat(claims.get("ruolo", String.class)).isEqualTo("MANAGER_AUTORI");
        assertThat(claims.get("stato", String.class)).isEqualTo("ATTIVO");
    }
}
