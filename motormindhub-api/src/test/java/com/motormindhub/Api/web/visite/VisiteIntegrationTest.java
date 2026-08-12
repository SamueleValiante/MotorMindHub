package com.motormindhub.Api.web.visite;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.model.repository.VisitaSessioneRepository;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import jakarta.servlet.http.Cookie;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB Postgres reale, filter chain reale) di
 * POST /api/v1/visite (RF3.1, UC_28): il roundtrip del cookie mmh_visit_session e' un concetto del
 * livello web, non coperto dagli unit test di GestioneAmministrazioneUtentiTest (li' il cookie non
 * esiste, solo l'Optional<String> restituito dal service).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class VisiteIntegrationTest {

    private static final String COOKIE_SESSIONE = "mmh_visit_session";
    private static final String PASSWORD = "PasswordValida78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private VisitaSessioneRepository visitaSessioneRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String creaUtenteELogga(String email, Ruolo ruolo) throws Exception {
        Utente utente = new Utente("Test", "Utente", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
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
    void registraVisita_primaChiamataSenzaCookie_persisteUnaRigaERestituisceUnNuovoCookie() throws Exception {
        long prima = visitaSessioneRepository.count();

        MvcResult result = mockMvc.perform(post("/api/v1/visite"))
                .andExpect(status().isNoContent())
                .andReturn();

        Cookie cookie = result.getResponse().getCookie(COOKIE_SESSIONE);
        assertThat(cookie).isNotNull();
        assertThat(cookie.getValue()).isNotBlank();
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(visitaSessioneRepository.count()).isEqualTo(prima + 1);
    }

    @Test
    void registraVisita_secondaChiamataConLoStessoCookie_nonPersisteUnaNuovaRigaENonRinnovaIlCookie() throws Exception {
        MvcResult prima = mockMvc.perform(post("/api/v1/visite"))
                .andExpect(status().isNoContent())
                .andReturn();
        Cookie cookie = prima.getResponse().getCookie(COOKIE_SESSIONE);
        long conteggioDopoLaPrima = visitaSessioneRepository.count();

        MvcResult seconda = mockMvc.perform(post("/api/v1/visite").cookie(cookie))
                .andExpect(status().isNoContent())
                .andReturn();

        assertThat(seconda.getResponse().getCookie(COOKIE_SESSIONE)).isNull();
        assertThat(visitaSessioneRepository.count()).isEqualTo(conteggioDopoLaPrima);
    }

    @Test
    void registraVisita_chiamataAutenticataComeAutore_nonPersisteNullaENonImpostaCookie() throws Exception {
        String jwt = creaUtenteELogga("visite-autore@provider.it", Ruolo.AUTORE);
        long prima = visitaSessioneRepository.count();

        MvcResult result = mockMvc.perform(post("/api/v1/visite").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNoContent())
                .andReturn();

        assertThat(result.getResponse().getCookie(COOKIE_SESSIONE)).isNull();
        assertThat(visitaSessioneRepository.count()).isEqualTo(prima);
    }
}
