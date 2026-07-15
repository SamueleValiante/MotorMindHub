package com.motormindhub.Api.web;

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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, filter chain reale - non mock) di
 * GlobalExceptionHandler.handleBodyNonLeggibile: prima dell'introduzione di questo handler, un body
 * JSON malformato o con un valore non compatibile col tipo atteso produceva un 403 vuoto invece di un
 * 400 con messaggio - identico sia con sia senza autenticazione, quindi non rilevabile da un test che
 * si limita a verificare l'autorizzazione. Copre due controller diversi (GestioneCategorie,
 * GestioneAmministrazioneUtenti) per dimostrare che il fix non e' specifico a un solo endpoint.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MalformedRequestBodyIntegrationTest {

    private static final String PASSWORD = "PasswordValida78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Long autoreId;
    private Long gestoreId;
    private Long utenteTargetId;

    @BeforeEach
    void creaUtentiDiTest() {
        autoreId = creaUtente("autore-malformed-test@provider.it", Ruolo.AUTORE);
        gestoreId = creaUtente("gestore-malformed-test@provider.it", Ruolo.GESTORE_UTENTI);
        utenteTargetId = creaUtente("target-malformed-test@provider.it", Ruolo.ISCRITTO);
    }

    private Long creaUtente(String email, Ruolo ruolo) {
        Utente utente = new Utente("Test", "MalformedBody", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(ruolo);
        return utenteRepository.saveAndFlush(utente).getId();
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void bodyConCampoNumericoNonValido_ritorna400ConMessaggio_suGestioneCategorie() throws Exception {
        String token = login("autore-malformed-test@provider.it");

        mockMvc.perform(post("/api/v1/categorie")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"nome\":\"Test\",\"categoriaPadreId\":\"non-un-numero\",\"descrizione\":null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.messages").isNotEmpty())
                .andExpect(jsonPath("$.messages[0]").isNotEmpty());
    }

    @Test
    void bodyConValoreEnumInesistente_ritorna400ConMessaggio_suGestioneAmministrazioneUtenti() throws Exception {
        String token = login("gestore-malformed-test@provider.it");

        mockMvc.perform(post("/api/v1/amministrazione-utenti/utenti/" + utenteTargetId + "/sospensione")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"motivazione\":\"VALORE_INVENTATO\",\"durataGiorni\":10}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.messages").isNotEmpty())
                .andExpect(jsonPath("$.messages[0]").isNotEmpty());
    }

    @Test
    void jsonSintatticamenteMalformato_ritorna400ConMessaggio_nonSpecificoAUnCampo() throws Exception {
        String token = login("gestore-malformed-test@provider.it");

        MvcResult result = mockMvc.perform(post("/api/v1/amministrazione-utenti/utenti/" + utenteTargetId + "/sospensione")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{questo non e' json valido"))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).isNotBlank();
    }
}
