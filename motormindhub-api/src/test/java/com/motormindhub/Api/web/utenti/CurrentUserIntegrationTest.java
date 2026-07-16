package com.motormindhub.Api.web.utenti;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Ruolo;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB reale, filter chain reale) di GET /api/v1/utenti/me:
 * UtentiControllerTest verifica gia' il cablaggio HTTP -> Service in isolamento (standaloneSetup,
 * niente @PreAuthorize valutato), qui si verifica invece l'autorizzazione reale (stesso pattern di
 * SelfServiceAuthorizationIntegrationTest - GESTORE_UTENTI escluso dai self-service, RAD 3.2.4) e che
 * il body risponda con i dati dell'utente autenticato, non di un id arbitrario (l'endpoint non accetta
 * nessun parametro id).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CurrentUserIntegrationTest {

    private static final String PASSWORD = "PasswordValida78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String creaUtenteELogga(String email, Ruolo ruolo, String biografia) throws Exception {
        Utente utente = new Utente("Marco", "Verdi", email, passwordEncoder.encode(PASSWORD), null, biografia, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(ruolo);
        utenteRepository.saveAndFlush(utente);

        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void getCurrentUser_restituisceIlProprioProfilo_quandoRuoloAmmesso() throws Exception {
        String jwt = creaUtenteELogga("me-iscritto@provider.it", Ruolo.ISCRITTO, "Appassionato di motori");

        mockMvc.perform(get("/api/v1/utenti/me").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me-iscritto@provider.it"))
                .andExpect(jsonPath("$.ruolo").value("ISCRITTO"))
                .andExpect(jsonPath("$.stato").value("ATTIVO"))
                .andExpect(jsonPath("$.nome").value("Marco"))
                .andExpect(jsonPath("$.cognome").value("Verdi"))
                .andExpect(jsonPath("$.biografia").value("Appassionato di motori"))
                .andExpect(jsonPath("$.dataRegistrazione").isNotEmpty());
    }

    @Test
    void getCurrentUser_ritorna403_perGestoreUtenti() throws Exception {
        String jwt = creaUtenteELogga("me-gestore@provider.it", Ruolo.GESTORE_UTENTI, null);

        mockMvc.perform(get("/api/v1/utenti/me").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
    }

    @Test
    void getCurrentUser_ritorna401_seNonAutenticato() throws Exception {
        // RestAuthenticationEntryPoint (SecurityConfig): l'assenza di autenticazione e' ora distinta
        // dal 403 di ruolo insufficiente sopra - copertura approfondita in
        // SecurityExceptionHandlingIntegrationTest.
        mockMvc.perform(get("/api/v1/utenti/me"))
                .andExpect(status().isUnauthorized());
    }
}
