package com.motormindhub.Api.web.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoVisitatore;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.entity.VisitaSessione;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.model.repository.VisitaSessioneRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB Postgres reale) della riclassificazione Guest->Iscritto
 * al login riuscito (RF3.1, UC_28, GestioneAmministrazioneUtenti.riclassificaComeIscritto): il cookie
 * mmh_visit_session viaggia verso /api/v1/auth/login solo se il suo Path lo permette
 * (VisiteController.cookieSessione, Path=/api/v1), quindi la copertura corretta di questo
 * comportamento richiede una vera richiesta HTTP, non un test isolato del service.
 *
 * @TestPropertySource: stesso motivo di RefreshTokenIntegrationTest - piu' metodi di test su questa
 * classe chiamano /auth/login sulla stessa EMAIL nello stesso contesto Spring cache (stesso
 * singleton LoginRateLimiter), superando altrimenti la soglia di default.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "security.login-rate-limit.capacity-per-minute=1000")
@Transactional
class LoginRiclassificaVisitaIntegrationTest {

    private static final String COOKIE_SESSIONE = "mmh_visit_session";
    private static final String EMAIL = "riclassifica-visita@provider.it";
    private static final String PASSWORD = "PasswordCorretta78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private VisitaSessioneRepository visitaSessioneRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private void creaUtenteAttivo() {
        Utente utente = new Utente("Riclassifica", "Test", EMAIL, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utenteRepository.saveAndFlush(utente);
    }

    private VisitaSessione seed(TipoVisitatore tipo) {
        VisitaSessione visita = new VisitaSessione(UUID.randomUUID().toString(), tipo);
        return visitaSessioneRepository.saveAndFlush(visita);
    }

    @Test
    void login_riclassificaLaSessioneGuestPreesistenteComeIscritto_quandoIlCookieCorrisponde() throws Exception {
        creaUtenteAttivo();
        VisitaSessione visitaGuest = seed(TipoVisitatore.GUEST);
        long dopoIlSeed = visitaSessioneRepository.count();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD)))
                        .cookie(new Cookie(COOKIE_SESSIONE, visitaGuest.getSessioneId())))
                .andExpect(status().isOk());

        VisitaSessione ricaricata = visitaSessioneRepository.findById(visitaGuest.getId()).orElseThrow();
        assertThat(ricaricata.getTipo()).isEqualTo(TipoVisitatore.ISCRITTO);
        assertThat(ricaricata.getSessioneId()).isEqualTo(visitaGuest.getSessioneId());
        assertThat(visitaSessioneRepository.count()).isEqualTo(dopoIlSeed); // nessuna nuova riga
    }

    @Test
    void login_nonSollevaEccezioniENonFaNulla_quandoIlCookieENonPresente() throws Exception {
        creaUtenteAttivo();
        long prima = visitaSessioneRepository.count();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD))))
                .andExpect(status().isOk());

        assertThat(visitaSessioneRepository.count()).isEqualTo(prima);
    }

    @Test
    void login_nonModificaNulla_quandoLaVisitaEGiaIscritto() throws Exception {
        creaUtenteAttivo();
        VisitaSessione visitaIscritto = seed(TipoVisitatore.ISCRITTO);
        long dopoIlSeed = visitaSessioneRepository.count();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD)))
                        .cookie(new Cookie(COOKIE_SESSIONE, visitaIscritto.getSessioneId())))
                .andExpect(status().isOk());

        VisitaSessione ricaricata = visitaSessioneRepository.findById(visitaIscritto.getId()).orElseThrow();
        assertThat(ricaricata.getTipo()).isEqualTo(TipoVisitatore.ISCRITTO);
        assertThat(visitaSessioneRepository.count()).isEqualTo(dopoIlSeed);
    }
}
