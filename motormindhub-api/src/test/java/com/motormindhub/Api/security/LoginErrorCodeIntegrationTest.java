package com.motormindhub.Api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifica che POST /api/v1/auth/login restituisca un errorCode distinto per le tre cause di
 * fallimento dell'autenticazione (BadCredentialsException / DisabledException / LockedException,
 * cfr. GlobalExceptionHandler): prima dell'introduzione di questi tre handler dedicati, tutte e tre
 * collassavano sullo stesso messaggio generico "Credenziali non valide." - indistinguibili lato
 * client, in contraddizione con RAD UC_2.1-2.3 (tre UX di login diverse: credenziali errate, account
 * non verificato, account bloccato/sospeso).
 *
 * Nota su SOSPESO vs bloccato-per-tentativi-falliti: entrambi risultano nello stesso errorCode
 * ACCOUNT_BLOCCATO, perche' Utente.isAccountNonLocked() (via UserPrincipal) e' un singolo booleano -
 * Spring Security non distingue la causa a questo livello. Coperti entrambi qui per documentare
 * esplicitamente che e' un comportamento voluto, non un buco di copertura.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class LoginErrorCodeIntegrationTest {

    private static final String PASSWORD = "PasswordValida78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void credenzialiErrate_ritornaErrorCodeCredenzialiNonValide() throws Exception {
        String email = "errorcode-credenziali@provider.it";
        creaUtenteAttivo(email);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, "password-sbagliata"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("CREDENZIALI_NON_VALIDE"))
                .andExpect(jsonPath("$.messages[0]").value("Credenziali non valide."));
    }

    @Test
    void accountNonVerificato_ritornaErrorCodeAccountNonVerificato() throws Exception {
        String email = "errorcode-nonverificato@provider.it";
        // Il costruttore imposta gia' stato = NON_VERIFICATO di default (registrazione reale).
        Utente utente = new Utente("Test", "ErrorCode", email, passwordEncoder.encode(PASSWORD),
                null, null, true, "token-verifica-test");
        utenteRepository.saveAndFlush(utente);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("ACCOUNT_NON_VERIFICATO"))
                .andExpect(jsonPath("$.messages[0]").value(
                        "Il tuo account non e' ancora stato verificato. Controlla la tua casella email per attivarlo."));
    }

    @Test
    void accountSospesoDaAmministratore_ritornaErrorCodeAccountBloccato() throws Exception {
        String email = "errorcode-sospeso@provider.it";
        Utente utente = creaUtenteAttivo(email);
        utente.setStato(StatoUtente.SOSPESO);
        utenteRepository.saveAndFlush(utente);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("ACCOUNT_BLOCCATO"))
                .andExpect(jsonPath("$.messages[0]").value(
                        "Il tuo account e' bloccato o sospeso. Controlla la tua email per le istruzioni."));
    }

    @Test
    void accountBloccatoPerTentativiFalliti_ritornaErrorCodeAccountBloccato() throws Exception {
        String email = "errorcode-bruteforce@provider.it";
        Utente utente = creaUtenteAttivo(email);
        utente.bloccaAccount("token-sblocco-test", Instant.now().plusSeconds(3600));
        utenteRepository.saveAndFlush(utente);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("ACCOUNT_BLOCCATO"))
                .andExpect(jsonPath("$.messages[0]").value(
                        "Il tuo account e' bloccato o sospeso. Controlla la tua email per le istruzioni."));
    }

    private Utente creaUtenteAttivo(String email) {
        Utente utente = new Utente("Test", "ErrorCode", email, passwordEncoder.encode(PASSWORD),
                null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        return utenteRepository.saveAndFlush(utente);
    }
}
