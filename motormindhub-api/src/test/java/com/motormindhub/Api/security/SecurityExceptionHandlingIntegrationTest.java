package com.motormindhub.Api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, filter chain reale) di RestAuthenticationEntryPoint e
 * RestAccessDeniedHandler: prima della loro introduzione, SecurityConfig non aveva un
 * AuthenticationEntryPoint dedicato, quindi sia l'assenza di autenticazione sia un ruolo
 * insufficiente ricadevano entrambi sul default Http403ForbiddenEntryPoint di Spring Security -
 * indistinguibili lato client (403 in entrambi i casi). Qui si verifica che i due scenari siano ora
 * distinti (401 vs 403) su piu' endpoint indipendenti, per escludere che il comportamento dipenda dal
 * singolo controller.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityExceptionHandlingIntegrationTest {

    private static final String PASSWORD = "PasswordValida78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String iscrittoJwt;
    private String gestoreJwt;

    @BeforeEach
    void creaUtentiDiTest() throws Exception {
        creaUtente("iscritto-exc-test@provider.it", Ruolo.ISCRITTO);
        creaUtente("gestore-exc-test@provider.it", Ruolo.GESTORE_UTENTI);

        iscrittoJwt = login("iscritto-exc-test@provider.it");
        gestoreJwt = login("gestore-exc-test@provider.it");
    }

    private void creaUtente(String email, Ruolo ruolo) {
        Utente utente = new Utente("Test", "Exc", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(ruolo);
        utenteRepository.saveAndFlush(utente);
    }

    private String login(String email) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    // --- Nessuna autenticazione -> 401 (RestAuthenticationEntryPoint) -----------------------------

    @Test
    void getCurrentUser_ritorna401ConBodyCoerente_seNessunToken() throws Exception {
        mockMvc.perform(get("/api/v1/utenti/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.messages[0]").isNotEmpty());
    }

    @Test
    void getDashboard_ritorna401ConBodyCoerente_seNessunToken() throws Exception {
        mockMvc.perform(get("/api/v1/amministrazione-utenti/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    // --- Autenticato ma ruolo insufficiente -> 403 (RestAccessDeniedHandler) ---------------------

    @Test
    void getCurrentUser_ritorna403ConBodyCoerente_seRuoloInsufficiente() throws Exception {
        mockMvc.perform(get("/api/v1/utenti/me").header("Authorization", "Bearer " + gestoreJwt))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.messages[0]").isNotEmpty());
    }

    @Test
    void getDashboard_ritorna403ConBodyCoerente_seRuoloInsufficiente() throws Exception {
        mockMvc.perform(get("/api/v1/amministrazione-utenti/dashboard").header("Authorization", "Bearer " + iscrittoJwt))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }
}
