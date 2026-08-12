package com.motormindhub.Api.web.amministrazioneUtenti;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoVisitatore;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.entity.VisitaSessione;
import com.motormindhub.Api.model.repository.ConteggioVisite;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.model.repository.VisitaSessioneRepository;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB Postgres reale) di GET
 * /api/v1/amministrazione-utenti/statistiche-visite (RF3.1, UC_28).
 *
 * La correttezza dei 5 aggregati rispetto ai confini di periodo (giorno/settimana/mese/anno) e'
 * verificata qui direttamente contro VisitaSessioneRepository.aggregaConteggi con Instant fissi
 * (deterministico, indipendente dall'istante reale di esecuzione del test - i confini calcolati dal
 * wall-clock reale sono gia' coperti dagli unit test di confiniPeriodo in
 * GestioneAmministrazioneUtentiTest): qui l'obiettivo e' la query nativa (FILTER) contro Postgres
 * vero, non la logica di calcolo dei confini. I test HTTP sotto verificano invece il cablaggio
 * end-to-end (endpoint -> service -> risposta) e il controllo di accesso.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class VisiteStatisticheIntegrationTest {

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

    private void seed(Instant dataVisita) {
        VisitaSessione visita = new VisitaSessione(UUID.randomUUID().toString(), TipoVisitatore.GUEST);
        ReflectionTestUtils.setField(visita, "dataVisita", dataVisita);
        visitaSessioneRepository.saveAndFlush(visita);
    }

    @Test
    void aggregaConteggi_contaCorrettamenteIQuattroConfiniEIlTotale_conIstantiFissi() {
        Instant inizioGiorno = Instant.parse("2026-08-12T00:00:00Z");
        Instant inizioSettimana = Instant.parse("2026-08-10T00:00:00Z");
        Instant inizioMese = Instant.parse("2026-08-01T00:00:00Z");
        Instant inizioAnno = Instant.parse("2026-01-01T00:00:00Z");

        seed(inizioAnno.minusSeconds(1));     // prima dell'anno: solo nel totale
        seed(inizioAnno.plusSeconds(1));      // nell'anno, prima del mese
        seed(inizioMese.plusSeconds(1));      // nel mese, prima della settimana
        seed(inizioSettimana.plusSeconds(1)); // nella settimana, prima del giorno
        seed(inizioGiorno.plusSeconds(1));    // nel giorno

        ConteggioVisite conteggio = visitaSessioneRepository.aggregaConteggi(
                inizioGiorno, inizioSettimana, inizioMese, inizioAnno);

        assertThat(conteggio.getOggi()).isEqualTo(1);
        assertThat(conteggio.getSettimana()).isEqualTo(2);
        assertThat(conteggio.getMese()).isEqualTo(3);
        assertThat(conteggio.getAnno()).isEqualTo(4);
        assertThat(conteggio.getTotale()).isEqualTo(5);
    }

    @Test
    void getVisiteStatistiche_restituisceIlTotaleEIlContatoreOggiCoerentiConLeRigheSeedate() throws Exception {
        // Delta rispetto a una baseline, non un valore assoluto: il DB Postgres locale e' condiviso
        // tra esecuzioni di test successive (stesso motivo di VisiteIntegrationTest) e puo' non
        // partire vuoto.
        String jwt = creaUtenteELogga("statistiche-visite@provider.it", Ruolo.GESTORE_UTENTI);
        MvcResult baseline = mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-visite")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        long totalePrima = objectMapper.readTree(baseline.getResponse().getContentAsString()).get("totale").asLong();
        long oggiPrima = objectMapper.readTree(baseline.getResponse().getContentAsString()).get("oggi").asLong();

        seed(Instant.now());
        seed(Instant.now());

        mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-visite")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totale").value(totalePrima + 2))
                .andExpect(jsonPath("$.oggi").value(oggiPrima + 2));
    }

    @Test
    void getVisiteStatistiche_restituisce403_perUnRuoloDiversoDaGestoreUtenti() throws Exception {
        String jwt = creaUtenteELogga("statistiche-visite-iscritto@provider.it", Ruolo.ISCRITTO);

        mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-visite")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
    }
}
