package com.motormindhub.Api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import com.motormindhub.Api.web.auth.RefreshTokenRequestDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB reale, filter chain reale - non mock) del refresh
 * token opaco (RNF9.2): come per LoginLockoutIntegrationTest, gli unit test di RefreshTokenServiceTest
 * verificano la logica isolata ma non possono verificare che AuthController e SecurityConfig
 * (endpoint pubblici, wiring del bean) siano davvero cablati correttamente end-to-end.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RefreshTokenIntegrationTest {

    private static final String EMAIL = "refresh-test@provider.it";
    private static final String PASSWORD = "PasswordCorretta78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void creaUtenteAttivo() {
        Utente utente = new Utente("Refresh", "Test", EMAIL, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utenteRepository.saveAndFlush(utente);
    }

    private String campoJson(MvcResult result, String campo) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).get(campo).asText();
    }

    private MvcResult login() throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
    }

    @Test
    void login_restituisceAccessTokenERefreshTokenDistinti() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void refresh_restituisceNuovaCoppiaERuotaIlVecchioToken() throws Exception {
        MvcResult loginResult = login();
        String vecchioRefreshToken = campoJson(loginResult, "refreshToken");

        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO(vecchioRefreshToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        // L'access token NON e' garantito diverso: i claim iat/exp del JWT hanno granularita' al
        // secondo (RFC 7519, NumericDate) - due emissioni per lo stesso utente nello stesso secondo
        // producono claim, e quindi firma, identici. Non e' un problema di sicurezza (un token
        // "duplicato" emesso un istante dopo non e' piu' permissivo del precedente): la proprieta'
        // rilevante da testare e' la rotation del refresh token, univoco per costruzione.
        String nuovoAccessToken = campoJson(refreshResult, "accessToken");
        String nuovoRefreshToken = campoJson(refreshResult, "refreshToken");
        assertThat(nuovoAccessToken).isNotBlank();
        assertThat(nuovoRefreshToken).isNotEqualTo(vecchioRefreshToken);

        // Il nuovo refresh token e' valido - verificato PRIMA di ripresentare il vecchio: farlo dopo
        // innescherebbe il rilevamento del riuso (vedi
        // refresh_revocaLIntereFamigliaDiSessioni_...), che revocherebbe anche questo token appena
        // emesso insieme al resto della famiglia - comportamento corretto ma non quello che questo
        // test vuole isolare (la sola rotation).
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO(nuovoRefreshToken))))
                .andExpect(status().isOk());

        // Rotation: il vecchio refresh token (gia' ruotato sopra) non e' piu' utilizzabile.
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO(vecchioRefreshToken))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_revocaLIntereFamigliaDiSessioni_quandoUnRefreshTokenGiaRuotatoVieneRipresentato() throws Exception {
        // Sessione A (es. laptop): login, poi rotation legittima token1 -> token2.
        String token1 = campoJson(login(), "refreshToken");
        String token2 = campoJson(mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO(token1))))
                .andExpect(status().isOk())
                .andReturn(), "refreshToken");

        // Sessione B (es. telefono): login indipendente sullo stesso account, ancora mai usato per il refresh.
        String tokenSessioneB = campoJson(login(), "refreshToken");

        // Riuso: qualcuno ripresenta il token1, gia' invalidato dalla rotation legittima sopra.
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO(token1))))
                .andExpect(status().isUnauthorized());

        // L'intera famiglia dell'utente e' ora revocata: anche il token2, legittimo e mai
        // presentato prima d'ora per un refresh, e il token della sessione B indipendente.
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO(token2))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO(tokenSessioneB))))
                .andExpect(status().isUnauthorized());

        // L'account resta comunque utilizzabile: un nuovo login riparte da zero.
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(EMAIL, PASSWORD))))
                .andExpect(status().isOk());
    }

    @Test
    void refresh_ritorna401_quandoTokenInesistente() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO("token-mai-emesso"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_invalidaIlRefreshTokenCorrente() throws Exception {
        MvcResult loginResult = login();
        String refreshToken = campoJson(loginResult, "refreshToken");

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO(refreshToken))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO(refreshToken))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_eIdempotente_nonFalliscePerTokenGiaRevocatoOInesistente() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequestDTO("token-mai-esistito"))))
                .andExpect(status().isOk());
    }
}
