package com.motormindhub.Api.web.utenti;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.service.gestioneUtenti.dto.PasswordResetRequestDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RF1.5, UC_3.1: "il sistema mostra comunque un messaggio neutro per non rivelare l'esistenza
 * dell'account". Prima dell'introduzione del try/catch in UtentiController.requestPasswordReset,
 * il testo del messaggio era già identico nei due casi, ma lo STATUS HTTP no: 202 Accepted per
 * un'email esistente/attiva, 409 Conflict (via GlobalExceptionHandler su AccountNonAttivoException)
 * per una email inesistente o un account non attivo - un attaccante poteva comunque enumerare gli
 * account registrati dal solo status code, a parita' di corpo della risposta. Qui si verifica che
 * risposta (status incluso) sia bit-per-bit identica in tutti e tre i casi.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PasswordResetRequestNonDisclosureIntegrationTest {

    private static final String MESSAGGIO_ATTESO =
            "{\"message\":\"Se l'indirizzo email e' associato a un account attivo, riceverai le istruzioni per il recupero.\"}";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void emailInesistente_stessoStatusEStessoMessaggioDiUnEmailValida() throws Exception {
        mockMvc.perform(post("/api/v1/utenti/password/recupero")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new PasswordResetRequestDTO("non-esiste-di-sicuro@provider.it"))))
                .andExpect(status().isAccepted())
                .andExpect(content().json(MESSAGGIO_ATTESO));
    }

    @Test
    void accountNonVerificato_stessoStatusEStessoMessaggioDiUnEmailValida() throws Exception {
        String email = "non-disclosure-nonverificato@provider.it";
        Utente utente = new Utente("Test", "NonDisclosure", email, passwordEncoder.encode("PasswordValida78!"),
                null, null, true, "token-verifica-test");
        utenteRepository.saveAndFlush(utente); // stato di default del costruttore: NON_VERIFICATO

        mockMvc.perform(post("/api/v1/utenti/password/recupero")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new PasswordResetRequestDTO(email))))
                .andExpect(status().isAccepted())
                .andExpect(content().json(MESSAGGIO_ATTESO));
    }

    @Test
    void accountAttivo_stessoStatusEStessoMessaggio() throws Exception {
        String email = "non-disclosure-attivo@provider.it";
        Utente utente = new Utente("Test", "NonDisclosure", email, passwordEncoder.encode("PasswordValida78!"),
                null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utenteRepository.saveAndFlush(utente);

        mockMvc.perform(post("/api/v1/utenti/password/recupero")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new PasswordResetRequestDTO(email))))
                .andExpect(status().isAccepted())
                .andExpect(content().json(MESSAGGIO_ATTESO));
    }
}
