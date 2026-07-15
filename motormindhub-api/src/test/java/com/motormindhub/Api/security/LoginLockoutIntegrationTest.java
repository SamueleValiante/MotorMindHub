package com.motormindhub.Api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB reale, filter chain di Spring Security reale - non
 * mock) del cablaggio anti-bruteforce (RNF2.6): i 6 test unitari di GestioneUtentiTest verificano la
 * logica di dominio isolata, ma non possono verificare che
 * SecurityConfig.authenticationManager(...) colleghi davvero un AuthenticationEventPublisher
 * all'ApplicationEventPublisher condiviso, ne' che LoginAttemptListener sia effettivamente registrato
 * e invocato dalla vera catena di autenticazione. Qui si passa dall'endpoint HTTP reale
 * /api/v1/auth/login, non dalla chiamata diretta al service.
 *
 * @Transactional: l'intero test (incluse le chiamate MockMvc, sincrone sullo stesso thread) gira in
 * un'unica transazione fatta rollback a fine test - stesso pattern usato per isolare i test da
 * modifiche persistenti al DB condiviso.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class LoginLockoutIntegrationTest {

    private static final int MAX_TENTATIVI_LOGIN_FALLITI = 5; // deve rimanere allineato a GestioneUtenti
    private static final String EMAIL = "lockout-test@provider.it";
    private static final String PASSWORD_CORRETTA = "PasswordCorretta78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void creaUtenteAttivo() {
        Utente utente = new Utente("Test", "Lockout", EMAIL, passwordEncoder.encode(PASSWORD_CORRETTA),
                null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utenteRepository.saveAndFlush(utente);
    }

    @Test
    void accountVieneBloccatoDopoSogliaTentativiFalliti_eSbloccatoDopoConfermaEmail() throws Exception {
        // Sotto soglia: credenziali sbagliate ma l'account non e' ancora bloccato.
        for (int i = 0; i < MAX_TENTATIVI_LOGIN_FALLITI - 1; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType("application/json")
                            .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, "password-sbagliata"))))
                    .andExpect(status().isUnauthorized());
        }
        Utente utenteSottoSoglia = utenteRepository.findByEmail(EMAIL).orElseThrow();
        assertThat(utenteSottoSoglia.isBloccato()).isFalse();

        // Tentativo che fa scattare la soglia.
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, "password-sbagliata"))))
                .andExpect(status().isUnauthorized());

        Utente utenteBloccato = utenteRepository.findByEmail(EMAIL).orElseThrow();
        assertThat(utenteBloccato.isBloccato()).isTrue();
        String tokenSblocco = utenteBloccato.getTokenSblocco();
        assertThat(tokenSblocco).isNotBlank();

        // L'account e' bloccato: anche la password CORRETTA viene respinta finche' resta bloccato.
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD_CORRETTA))))
                .andExpect(status().isUnauthorized());

        // Sblocco via link di conferma email (simulato: nessuna email reale, si usa direttamente
        // il token persistito, equivalente a cliccare il link ricevuto).
        mockMvc.perform(get("/api/v1/utenti/sblocco-account").param("token", tokenSblocco))
                .andExpect(status().isOk());

        Utente utenteSbloccato = utenteRepository.findByEmail(EMAIL).orElseThrow();
        assertThat(utenteSbloccato.isBloccato()).isFalse();
        assertThat(utenteSbloccato.getTentativiFalliti()).isZero();

        // Ora il login con la password corretta funziona di nuovo.
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD_CORRETTA))))
                .andExpect(status().isOk());
    }

    @Test
    void loginRiuscito_azzeraContatoreTentativiFalliti() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, "password-sbagliata"))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, "password-sbagliata"))))
                .andExpect(status().isUnauthorized());
        assertThat(utenteRepository.findByEmail(EMAIL).orElseThrow().getTentativiFalliti()).isEqualTo(2);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD_CORRETTA))))
                .andExpect(status().isOk());

        Optional<Utente> utente = utenteRepository.findByEmail(EMAIL);
        assertThat(utente).isPresent();
        assertThat(utente.get().getTentativiFalliti()).isZero();
    }
}
