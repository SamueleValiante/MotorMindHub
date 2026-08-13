package com.motormindhub.Api.web.amministrazioneUtenti;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.InvitoAutore;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoVisitatore;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.entity.VisitaSessione;
import com.motormindhub.Api.model.repository.InvitoAutoreRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.model.repository.VisitaSessioneRepository;
import com.motormindhub.Api.service.gestioneAutori.dto.SetPasswordDTO;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB Postgres reale) dei due grafici "Andamento" della
 * dashboard Gestore Utenti: GET /statistiche-visite/andamento (RF3.1, UC_28) e GET
 * /statistiche-registrazioni/andamento (RF4.1). La logica di zero-fill/clamp sui valori esatti e'
 * gia' coperta deterministicamente (repository mockato) da GestioneAmministrazioneUtentiTest; qui
 * l'obiettivo e' la query nativa contro Postgres vero, il cablaggio HTTP end-to-end e il controllo
 * di accesso - stessa divisione di responsabilita' di VisiteStatisticheIntegrationTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AndamentoStatisticheIntegrationTest {

    private static final String PASSWORD = "PasswordValida78!";
    private static final ZoneId ZONA_VISITE = ZoneId.of("Europe/Rome");

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private VisitaSessioneRepository visitaSessioneRepository;
    @Autowired
    private InvitoAutoreRepository invitoAutoreRepository;
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

    private void seedVisita(TipoVisitatore tipo) {
        visitaSessioneRepository.saveAndFlush(new VisitaSessione(UUID.randomUUID().toString(), tipo));
    }

    // --- GET /statistiche-visite/andamento ----------------------------------------

    @Test
    void getAndamentoVisite_conteggiaNelPuntoDiOggiLeVisiteAppenaRegistrate_comeDeltaSullaBaseline() throws Exception {
        // Delta rispetto a una baseline, non un valore assoluto: il DB Postgres locale e' condiviso
        // tra esecuzioni di test successive (stesso motivo di VisiteStatisticheIntegrationTest) e
        // puo' non partire vuoto. giorni=1 riduce la serie al solo punto di oggi, indice [0] fisso.
        String jwt = creaUtenteELogga("andamento-visite-baseline@provider.it", Ruolo.GESTORE_UTENTI);
        MvcResult baseline = mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-visite/andamento")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode puntoBaseline = objectMapper.readTree(baseline.getResponse().getContentAsString()).get(0);
        long guestPrima = puntoBaseline.get("guest").asLong();
        long iscrittoPrima = puntoBaseline.get("iscritto").asLong();

        seedVisita(TipoVisitatore.GUEST);
        seedVisita(TipoVisitatore.GUEST);
        seedVisita(TipoVisitatore.ISCRITTO);

        MvcResult result = mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-visite/andamento")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode punto = objectMapper.readTree(result.getResponse().getContentAsString()).get(0);

        assertThat(punto.get("data").asText()).isEqualTo(LocalDate.now(ZONA_VISITE).toString());
        assertThat(punto.get("guest").asLong()).isEqualTo(guestPrima + 2);
        assertThat(punto.get("iscritto").asLong()).isEqualTo(iscrittoPrima + 1);
    }

    @Test
    void getAndamentoVisite_restituisceUnPuntoPerOgniGiornoDellaFinestra_conDateConsecutiveFinoAdOggiCompreso() throws Exception {
        String jwt = creaUtenteELogga("andamento-visite-zerofill@provider.it", Ruolo.GESTORE_UTENTI);

        MvcResult result = mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-visite/andamento")
                        .param("giorni", "7")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode serie = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(serie).hasSize(7);
        LocalDate oggi = LocalDate.now(ZONA_VISITE);
        for (int i = 0; i < 7; i++) {
            // Zero-fill: ogni giorno della finestra compare, anche quelli senza nessuna visita
            // registrata - se lo zero-fill non funzionasse, i giorni senza dati mancherebbero e la
            // sequenza di date avrebbe dei buchi invece di essere consecutiva.
            assertThat(serie.get(i).get("data").asText()).isEqualTo(oggi.minusDays(6 - i).toString());
        }
    }

    @Test
    void getAndamentoVisite_clampaLaFinestraA90Giorni_quandoGiorniRichiestiOltreIlMassimo() throws Exception {
        String jwt = creaUtenteELogga("andamento-visite-clamp@provider.it", Ruolo.GESTORE_UTENTI);

        MvcResult result = mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-visite/andamento")
                        .param("giorni", "365")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode serie = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(serie).hasSize(90);
    }

    @Test
    void getAndamentoVisite_restituisce403_perUnRuoloDiversoDaGestoreUtenti() throws Exception {
        String jwt = creaUtenteELogga("andamento-visite-iscritto@provider.it", Ruolo.ISCRITTO);

        mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-visite/andamento")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
    }

    // --- GET /statistiche-registrazioni/andamento ---------------------------------

    @Test
    void getAndamentoRegistrazioni_contaSoloLIscrittoEscludendoLAccountCreatoViaInvitoAutoreAccettato() throws Exception {
        String jwt = creaUtenteELogga("andamento-registrazioni-gestore@provider.it", Ruolo.GESTORE_UTENTI);
        MvcResult baseline = mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-registrazioni/andamento")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        long numeroPrima = objectMapper.readTree(baseline.getResponse().getContentAsString())
                .get(0).get("numeroRegistrazioni").asLong();

        // Registrazione pubblica (ISCRITTO): deve incrementare il conteggio di 1.
        Utente iscritto = new Utente("Nuovo", "Iscritto", "andamento-nuovo-iscritto@provider.it",
                passwordEncoder.encode(PASSWORD), null, null, true, null);
        iscritto.setStato(StatoUtente.ATTIVO);
        utenteRepository.saveAndFlush(iscritto);

        // Invito Autore accettato attraverso il flusso reale (GestioneAutori.acceptInvite, non un
        // bypass diretto sul repository): deve creare una riga Utente con la stessa dataRegistrazione
        // "oggi" dell'Iscritto qui sopra, ma NON deve comparire nel conteggio - e' esattamente il
        // bug potenziale che UtenteRepository.andamentoGiornaliero previene con WHERE ruolo = ISCRITTO.
        InvitoAutore invito = new InvitoAutore("Nuovo", "Autore", "andamento-nuovo-autore@provider.it",
                Ruolo.AUTORE, UUID.randomUUID().toString(), Instant.now().plus(7, ChronoUnit.DAYS));
        invitoAutoreRepository.saveAndFlush(invito);
        mockMvc.perform(post("/api/v1/autori/inviti/" + invito.getToken() + "/accetta")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new SetPasswordDTO(PASSWORD))))
                .andExpect(status().isOk());
        assertThat(utenteRepository.findByEmail("andamento-nuovo-autore@provider.it")).isPresent();

        MvcResult result = mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-registrazioni/andamento")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        long numeroDopo = objectMapper.readTree(result.getResponse().getContentAsString())
                .get(0).get("numeroRegistrazioni").asLong();

        assertThat(numeroDopo).isEqualTo(numeroPrima + 1);
    }

    @Test
    void getAndamentoRegistrazioni_restituisceUnPuntoPerOgniGiornoDellaFinestra_conDateConsecutiveFinoAdOggiCompreso() throws Exception {
        String jwt = creaUtenteELogga("andamento-registrazioni-zerofill@provider.it", Ruolo.GESTORE_UTENTI);

        MvcResult result = mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-registrazioni/andamento")
                        .param("giorni", "5")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode serie = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(serie).hasSize(5);
        LocalDate oggi = LocalDate.now(ZONA_VISITE);
        for (int i = 0; i < 5; i++) {
            assertThat(serie.get(i).get("data").asText()).isEqualTo(oggi.minusDays(4 - i).toString());
        }
    }

    @Test
    void getAndamentoRegistrazioni_restituisce403_perUnRuoloDiversoDaGestoreUtenti() throws Exception {
        String jwt = creaUtenteELogga("andamento-registrazioni-iscritto@provider.it", Ruolo.ISCRITTO);

        mockMvc.perform(get("/api/v1/amministrazione-utenti/statistiche-registrazioni/andamento")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
    }
}
