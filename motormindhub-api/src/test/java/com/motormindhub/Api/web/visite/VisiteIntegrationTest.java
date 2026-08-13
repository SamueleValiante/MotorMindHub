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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
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

    /**
     * Verifica esplicita sulla stringa dell'header Set-Cookie, non solo sullo status/sul valore del
     * cookie: un bug reale in produzione (SameSite restava Lax invece di None su Railway, perche'
     * server.forward-headers-strategy non era configurato e HttpServletRequest.isSecure() ignorava
     * X-Forwarded-Proto) non sarebbe stato catturato dagli altri test di questa classe, che non
     * ispezionano SameSite/Secure. Nessun header X-Forwarded-Proto qui: simula una richiesta locale
     * senza proxy, ramo atteso SameSite=Lax.
     */
    @Test
    void registraVisita_richiestaLocaleSenzaProxy_emetteCookieConSameSiteLax() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/visite"))
                .andExpect(status().isNoContent())
                .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).contains("SameSite=Lax");
        assertThat(setCookie).doesNotContain("SameSite=None");
        assertThat(setCookie).doesNotContainIgnoringCase("Secure");
    }

    /**
     * Simula la richiesta reale su Railway (TLS terminato sull'edge, proxy interno che inoltra HTTP
     * semplice all'app con X-Forwarded-Proto: https). Con server.forward-headers-strategy=framework
     * il ForwardedHeaderFilter riscrive lo scheme prima del controller, quindi request.isSecure()
     * diventa true e il cookie deve uscire con SameSite=None; Secure - il ramo che in produzione non
     * veniva mai raggiunto prima del fix.
     */
    @Test
    void registraVisita_richiestaDietroProxyConXForwardedProtoHttps_emetteCookieConSameSiteNoneESecure() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/visite").header("X-Forwarded-Proto", "https"))
                .andExpect(status().isNoContent())
                .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).contains("SameSite=None");
        assertThat(setCookie).containsIgnoringCase("Secure");
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

    /**
     * Bug segnalato dal vivo: le visite di ruoli redazionali risultavano contate nonostante
     * registraVisita escluda esplicitamente callerRuolo != ISCRITTO. Investigato: ne' il controller
     * ne' JwtAuthenticationFilter avevano un problema (questo test, gia' presente solo per AUTORE
     * prima di questa estensione, lo dimostrava gia'); la causa reale era nel front-end
     * (PageViewTracker, race sul bootstrap dell'access token in memoria - cfr. commit di questo fix)
     * e non e' quindi riproducibile qui, dove l'header Authorization e' sempre presente per
     * costruzione (MockMvc lo allega esplicitamente). Parametrizzato sui tre ruoli redazionali per
     * dimostrare esplicitamente, con una richiesta HTTP reale attraverso l'intera filter chain
     * (non un unit test sul service con repository mockato), che nessuno dei tre produce mai una
     * riga quando il token arriva correttamente.
     */
    @ParameterizedTest
    @EnumSource(value = Ruolo.class, names = {"AUTORE", "MANAGER_AUTORI", "GESTORE_UTENTI"})
    void registraVisita_chiamataAutenticataComeRuoloRedazionale_nonPersisteNullaENonImpostaCookie(Ruolo ruolo) throws Exception {
        String jwt = creaUtenteELogga("visite-redazionale-" + ruolo.name().toLowerCase() + "@provider.it", ruolo);
        long prima = visitaSessioneRepository.count();

        MvcResult result = mockMvc.perform(post("/api/v1/visite").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isNoContent())
                .andReturn();

        assertThat(result.getResponse().getCookie(COOKIE_SESSIONE)).isNull();
        assertThat(visitaSessioneRepository.count()).isEqualTo(prima);
    }
}
