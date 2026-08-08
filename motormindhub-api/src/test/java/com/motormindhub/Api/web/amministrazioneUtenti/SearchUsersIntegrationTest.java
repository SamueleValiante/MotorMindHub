package com.motormindhub.Api.web.amministrazioneUtenti;

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
 * Test end-to-end (contesto Spring reale, DB Postgres reale, filter chain reale — non mock, non
 * @DataJpaTest) di GET /api/v1/amministrazione-utenti/utenti: regressione di un 500 riprodotto dal
 * vivo, "function lower(bytea) does not exist" — con :query bindato a null e usato sia in un
 * confronto diretto (":query IS NULL") sia dentro LOWER(...) nella stessa query JPQL,
 * Hibernate/PostgreSQL non riuscivano a inferirne il tipo SQL in modo affidabile. Un
 * @DataJpaTest (embedded o meno) o un test unitario col repository mockato non l'avrebbero mai
 * rilevato: il primo perché H2 non è vulnerabile allo stesso problema di inferenza di tipo di
 * PostgreSQL, il secondo perché il repository è un mock. Qui si passa dal vero endpoint HTTP,
 * senza alcun parametro query — esattamente la chiamata che il frontend fa al primo caricamento
 * di "Gestione Account" (mockup 39) e che falliva sistematicamente.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SearchUsersIntegrationTest {

    private static final String PASSWORD = "PasswordValida78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String creaGestoreELogga(String email) throws Exception {
        Utente utente = new Utente("Test", "Gestore", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(Ruolo.GESTORE_UTENTI);
        utenteRepository.saveAndFlush(utente);

        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void searchUsers_senzaAlcunParametro_nonVaIn500() throws Exception {
        String jwt = creaGestoreELogga("search-senza-query@provider.it");

        mockMvc.perform(get("/api/v1/amministrazione-utenti/utenti").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());
    }

    @Test
    void searchUsers_conSoloIlFiltroStato_nonVaIn500() throws Exception {
        String jwt = creaGestoreELogga("search-solo-stato@provider.it");

        mockMvc.perform(get("/api/v1/amministrazione-utenti/utenti")
                        .param("stato", "ATTIVO")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());
    }

    @Test
    void searchUsers_includeIlCampoRuoloNellaRispostaJson() throws Exception {
        String jwt = creaGestoreELogga("search-con-ruolo@provider.it");

        mockMvc.perform(get("/api/v1/amministrazione-utenti/utenti").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ruolo").value("GESTORE_UTENTI"));
    }
}
