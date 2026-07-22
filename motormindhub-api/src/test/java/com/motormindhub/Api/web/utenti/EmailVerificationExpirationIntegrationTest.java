package com.motormindhub.Api.web.utenti;

import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.UtenteRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RNF9.3: il token di verifica email deve avere una scadenza esplicita (24h), allineata a quella
 * gia' corretta del token di recupero password. Verifica end-to-end (ODD 2.1 verifyEmail) sia il
 * caso felice sia la scadenza, che qui viene forzata scrivendo direttamente una data nel passato
 * invece di attendere 24 ore reali.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class EmailVerificationExpirationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void tokenValidoEntroScadenza_attivaAccount() throws Exception {
        Utente utente = new Utente("Test", "Verifica", "verifica-valida@provider.it",
                passwordEncoder.encode("PasswordValida78!"), null, null, true, "tok-verifica-valido");
        utente.setDataScadenzaTokenVerifica(Instant.now().plus(1, ChronoUnit.HOURS));
        utenteRepository.saveAndFlush(utente);

        mockMvc.perform(get("/api/v1/utenti/verifica-email").param("token", "tok-verifica-valido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account attivato con successo."));

        Utente aggiornato = utenteRepository.findById(utente.getId()).orElseThrow();
        assertThat(aggiornato.getStato()).isEqualTo(StatoUtente.ATTIVO);
        assertThat(aggiornato.getTokenVerifica()).isNull();
        assertThat(aggiornato.getDataScadenzaTokenVerifica()).isNull();
    }

    @Test
    void tokenScaduto_erroreDedicatoEAccountRestaNonVerificato() throws Exception {
        Utente utente = new Utente("Test", "Verifica", "verifica-scaduta@provider.it",
                passwordEncoder.encode("PasswordValida78!"), null, null, true, "tok-verifica-scaduto");
        utente.setDataScadenzaTokenVerifica(Instant.now().minus(1, ChronoUnit.HOURS));
        utenteRepository.saveAndFlush(utente);

        mockMvc.perform(get("/api/v1/utenti/verifica-email").param("token", "tok-verifica-scaduto"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("TOKEN_VERIFICA_SCADUTO"));

        Utente aggiornato = utenteRepository.findById(utente.getId()).orElseThrow();
        assertThat(aggiornato.getStato()).isEqualTo(StatoUtente.NON_VERIFICATO);
    }
}
