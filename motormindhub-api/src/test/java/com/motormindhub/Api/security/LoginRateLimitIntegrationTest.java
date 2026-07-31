package com.motormindhub.Api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end (endpoint HTTP reale, non la chiamata diretta a LoginRateLimiter): verifica che
 * /api/v1/auth/login sia limitato per EMAIL, non per IP - coerente con la scelta discussa (login
 * passa da un route handler server-side di Next.js in produzione, il backend vedrebbe sempre lo
 * stesso IP per tutti gli utenti).
 *
 * @TestPropertySource abbassa la soglia solo per questa classe: usa un contesto Spring dedicato
 * (chiave di cache diversa da quello condiviso dagli altri @SpringBootTest), quindi non tocca la
 * soglia alta impostata in test/resources/application.properties per il resto della suite.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "security.login-rate-limit.capacity-per-minute=3")
@Transactional
class LoginRateLimitIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void loginRipetuto_sullaStessaEmail_vieneLimitatoDopoLaSoglia_indipendentementeDallIp() throws Exception {
        String email = "rate-limit-test@provider.it";

        // Sotto soglia (3): 3 tentativi, ciascuno da un IP diverso - la chiave e' l'email, non l'IP.
        for (int i = 1; i <= 3; i++) {
            String ip = "203.0.113." + i;
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType("application/json")
                            .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, "password-sbagliata")))
                            .with(request -> {
                                request.setRemoteAddr(ip);
                                return request;
                            }))
                    .andExpect(status().isUnauthorized()); // credenziali errate, non ancora rate-limited
        }

        // Quarto tentativo, stessa email, ANCORA un IP diverso dai precedenti: comunque bloccato.
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, "password-sbagliata")))
                        .with(request -> {
                            request.setRemoteAddr("203.0.113.99");
                            return request;
                        }))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void loginSuUnaEmailDiversa_nonRisenteDelLimiteRaggiuntoDaUnAltraEmail_stessoIp() throws Exception {
        String ip = "198.51.100.1";
        String emailEsaurita = "esaurita@provider.it";
        String emailNuova = "non-ancora-usata@provider.it";

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType("application/json")
                            .content(objectMapper.writeValueAsString(new LoginRequestDTO(emailEsaurita, "password-sbagliata")))
                            .with(request -> {
                                request.setRemoteAddr(ip);
                                return request;
                            }))
                    .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(emailEsaurita, "password-sbagliata")))
                        .with(request -> {
                            request.setRemoteAddr(ip);
                            return request;
                        }))
                .andExpect(status().isTooManyRequests());

        // Stesso IP, email diversa: bucket indipendente, non ancora toccato.
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(emailNuova, "password-sbagliata")))
                        .with(request -> {
                            request.setRemoteAddr(ip);
                            return request;
                        }))
                .andExpect(status().isUnauthorized());
    }
}
