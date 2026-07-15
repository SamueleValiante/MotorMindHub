package com.motormindhub.Api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.GestioneAmministrazioneUtenti;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.MotivazioneSospensione;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.SuspensionDTO;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB reale, filter chain reale) del gap segnalato per
 * JwtAuthenticationFilter: prima di questa modifica, un access token gia' emesso restava "valido"
 * (firma/scadenza OK) anche dopo che l'account veniva sospeso o bloccato nel frattempo, perche' il
 * filtro non ricontrollava isEnabled()/isAccountNonLocked() dopo aver ricaricato l'utente dal DB.
 * Qui si verifica che lo STESSO access token, mai scaduto, smetta di funzionare non appena lo stato
 * dell'account cambia - non un nuovo login con credenziali rifiutate (gia' coperto da
 * LoginLockoutIntegrationTest).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AccountSospesoOBloccatoConTokenGiaEmessoIntegrationTest {

    private static final int MAX_TENTATIVI_LOGIN_FALLITI = 5; // deve rimanere allineato a GestioneUtenti
    private static final String PASSWORD = "PasswordCorretta78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private GestioneAmministrazioneUtenti gestioneAmministrazioneUtenti;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String creaUtenteAttivoERestituisciEmail(String email) {
        Utente utente = new Utente("Test", "Revoca", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utenteRepository.saveAndFlush(utente);
        return email;
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
    void richiestaConTokenValido_ritorna401_seAccountVieneSospesoDopoLEmissione() throws Exception {
        String email = creaUtenteAttivoERestituisciEmail("sospeso-post-login@provider.it");
        String accessToken = login(email);

        // Il token funziona prima della sospensione.
        mockMvc.perform(get("/api/v1/articoli/salvataggi")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        Long userId = utenteRepository.findByEmail(email).orElseThrow().getId();
        gestioneAmministrazioneUtenti.suspendAccount(userId,
                new SuspensionDTO(MotivazioneSospensione.ALTRO, "sospeso durante il test", null));

        // Stesso token, mai scaduto: deve essere rifiutato ora che l'account e' SOSPESO.
        mockMvc.perform(get("/api/v1/articoli/salvataggi")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.messages[0]").value("Account sospeso o bloccato."));
    }

    @Test
    void richiestaConTokenValido_ritorna401_seAccountVieneBloccatoPerTentativiFalliti() throws Exception {
        String email = creaUtenteAttivoERestituisciEmail("bloccato-post-login@provider.it");
        String accessToken = login(email);

        // Il token funziona prima del blocco.
        mockMvc.perform(get("/api/v1/articoli/salvataggi")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        // Soglia di tentativi falliti raggiunta con richieste separate (stesso percorso di
        // LoginAttemptListener usato in produzione, non manipolazione diretta dell'entita').
        for (int i = 0; i < MAX_TENTATIVI_LOGIN_FALLITI; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType("application/json")
                            .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, "password-sbagliata"))))
                    .andExpect(status().isUnauthorized());
        }
        assertThat(utenteRepository.findByEmail(email).orElseThrow().isBloccato()).isTrue();

        // Stesso access token emesso prima del blocco, mai scaduto: deve essere rifiutato ora.
        mockMvc.perform(get("/api/v1/articoli/salvataggi")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.messages[0]").value("Account sospeso o bloccato."));
    }
}
