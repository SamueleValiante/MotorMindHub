package com.motormindhub.Api.web.autori;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Articolo;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoArticolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
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

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB Postgres reale) dei sei grafici/classifiche/aggregati
 * della dashboard Manager Autori (RF3.1, ODD 2.4): GET .../statistiche-autori/letture,
 * andamento-pubblicazioni, andamento-categorie, andamento-approvazioni, andamento-letture,
 * categorie-piu-lette. La logica di zero-fill/clamp sui
 * valori esatti e' gia' coperta deterministicamente (repository mockato) da GestioneAutoriTest; qui
 * l'obiettivo e' la query nativa contro Postgres vero, il cablaggio HTTP end-to-end e il controllo di
 * accesso - stessa divisione di responsabilita' di AndamentoStatisticheIntegrationTest (§2.5).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AutoriStatisticheIntegrationTest {

    private static final String PASSWORD = "PasswordValida78!";
    private static final ZoneId ZONA_STATISTICHE = ZoneId.of("Europe/Rome");

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private ArticoloRepository articoloRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;
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

    private Utente creaAutore(String email) {
        Utente autore = new Utente("Autore", "Test", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        autore.setStato(StatoUtente.ATTIVO);
        autore.setRuolo(Ruolo.AUTORE);
        return utenteRepository.saveAndFlush(autore);
    }

    private Categoria creaCategoria(String nome, Categoria padre) {
        return categoriaRepository.saveAndFlush(new Categoria(nome, "descrizione", padre));
    }

    /** Passa per IN_ATTESA_APPROVAZIONE -> Articolo.approva() reale, cosi' dataDecisione e' stampata dal metodo di dominio, non simulata. */
    private Articolo creaArticoloPubblicato(Utente autore, Categoria categoria) {
        Articolo articolo = new Articolo(autore, "Titolo", "Testo", categoria, "tag", null);
        articolo.setStato(StatoArticolo.IN_ATTESA_APPROVAZIONE);
        articolo = articoloRepository.saveAndFlush(articolo);
        articolo.approva();
        return articoloRepository.saveAndFlush(articolo);
    }

    private Articolo creaArticoloRifiutato(Utente autore, Categoria categoria) {
        Articolo articolo = new Articolo(autore, "Titolo", "Testo", categoria, "tag", null);
        articolo.setStato(StatoArticolo.IN_ATTESA_APPROVAZIONE);
        articolo = articoloRepository.saveAndFlush(articolo);
        articolo.rifiuta("Motivazione di test");
        return articoloRepository.saveAndFlush(articolo);
    }

    // --- GET /statistiche-autori/letture ----------------------------------------

    @Test
    void getStatisticheLetture_restituisceIlTotaleEIlContatoreOggiCoerentiConLeLettureGenerate() throws Exception {
        // Delta rispetto a una baseline, non un valore assoluto: il DB Postgres locale e' condiviso
        // tra esecuzioni di test successive e puo' non partire vuoto (stesso motivo di
        // VisiteStatisticheIntegrationTest.getVisiteStatistiche_..., §2.5).
        String jwt = creaUtenteELogga("statistiche-letture-manager@provider.it", Ruolo.MANAGER_AUTORI);
        MvcResult baseline = mockMvc.perform(get("/api/v1/autori/statistiche-autori/letture")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode statisticheBaseline = objectMapper.readTree(baseline.getResponse().getContentAsString());
        long totalePrima = statisticheBaseline.get("totale").asLong();
        long oggiPrima = statisticheBaseline.get("oggi").asLong();

        Utente autore = creaAutore("statistiche-letture-autore@provider.it");
        Categoria categoria = creaCategoria("Freni", null);
        Articolo primoArticolo = creaArticoloPubblicato(autore, categoria);
        Articolo secondoArticolo = creaArticoloPubblicato(autore, categoria);
        mockMvc.perform(get("/api/v1/articoli/{articleId}", primoArticolo.getId())).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/articoli/{articleId}", secondoArticolo.getId())).andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/v1/autori/statistiche-autori/letture")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode statistiche = objectMapper.readTree(result.getResponse().getContentAsString());

        assertThat(statistiche.get("totale").asLong()).isEqualTo(totalePrima + 2);
        assertThat(statistiche.get("oggi").asLong()).isEqualTo(oggiPrima + 2);
    }

    @Test
    void getStatisticheLetture_restituisce403_perUnRuoloDiversoDaManagerAutori() throws Exception {
        String jwt = creaUtenteELogga("statistiche-letture-iscritto@provider.it", Ruolo.ISCRITTO);

        mockMvc.perform(get("/api/v1/autori/statistiche-autori/letture")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
    }

    // --- GET /statistiche-autori/andamento-pubblicazioni ----------------------------------------

    @Test
    void getAndamentoPubblicazioni_conteggiaNelPuntoDiOggiLArticoloAppenaApprovato_comeDeltaSullaBaseline() throws Exception {
        String jwt = creaUtenteELogga("andamento-pubblicazioni-manager@provider.it", Ruolo.MANAGER_AUTORI);
        MvcResult baseline = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-pubblicazioni")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        long prima = objectMapper.readTree(baseline.getResponse().getContentAsString()).get(0).get("numeroPubblicazioni").asLong();

        Utente autore = creaAutore("andamento-pubblicazioni-autore@provider.it");
        Categoria categoria = creaCategoria("Motore", null);
        creaArticoloPubblicato(autore, categoria);

        MvcResult result = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-pubblicazioni")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode punto = objectMapper.readTree(result.getResponse().getContentAsString()).get(0);

        assertThat(punto.get("data").asText()).isEqualTo(LocalDate.now(ZONA_STATISTICHE).toString());
        assertThat(punto.get("numeroPubblicazioni").asLong()).isEqualTo(prima + 1);
    }

    @Test
    void getAndamentoPubblicazioni_clampaLaFinestraA90Giorni_quandoGiorniRichiestiOltreIlMassimo() throws Exception {
        String jwt = creaUtenteELogga("andamento-pubblicazioni-clamp@provider.it", Ruolo.MANAGER_AUTORI);

        MvcResult result = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-pubblicazioni")
                        .param("giorni", "365")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode serie = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(serie).hasSize(90);
    }

    // --- GET /statistiche-autori/andamento-categorie ----------------------------------------

    @Test
    void getAndamentoCategorie_conteggiaNelPuntoDiOggiLaCategoriaAppenaCreata_comeDeltaSullaBaseline() throws Exception {
        String jwt = creaUtenteELogga("andamento-categorie-manager@provider.it", Ruolo.MANAGER_AUTORI);
        MvcResult baseline = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-categorie")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        long prima = objectMapper.readTree(baseline.getResponse().getContentAsString()).get(0).get("numeroCategorie").asLong();

        creaCategoria("Categoria " + UUID.randomUUID(), null);

        MvcResult result = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-categorie")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        long dopo = objectMapper.readTree(result.getResponse().getContentAsString()).get(0).get("numeroCategorie").asLong();

        assertThat(dopo).isEqualTo(prima + 1);
    }

    @Test
    void getAndamentoCategorie_restituisceUnPuntoPerOgniGiornoDellaFinestra_conDateConsecutiveFinoAdOggiCompreso() throws Exception {
        String jwt = creaUtenteELogga("andamento-categorie-zerofill@provider.it", Ruolo.MANAGER_AUTORI);

        MvcResult result = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-categorie")
                        .param("giorni", "7")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode serie = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(serie).hasSize(7);
        LocalDate oggi = LocalDate.now(ZONA_STATISTICHE);
        for (int i = 0; i < 7; i++) {
            assertThat(serie.get(i).get("data").asText()).isEqualTo(oggi.minusDays(6 - i).toString());
        }
    }

    // --- GET /statistiche-autori/andamento-approvazioni ----------------------------------------

    @Test
    void getAndamentoApprovazioni_conteggiaNelPuntoDiOggiApprovatiERifiutati_comeDeltaSullaBaseline() throws Exception {
        String jwt = creaUtenteELogga("andamento-approvazioni-manager@provider.it", Ruolo.MANAGER_AUTORI);
        MvcResult baseline = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-approvazioni")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode puntoBaseline = objectMapper.readTree(baseline.getResponse().getContentAsString()).get(0);
        long approvatiPrima = puntoBaseline.get("approvati").asLong();
        long rifiutatiPrima = puntoBaseline.get("rifiutati").asLong();

        Utente autore = creaAutore("andamento-approvazioni-autore@provider.it");
        Categoria categoria = creaCategoria("Carrozzeria", null);
        creaArticoloPubblicato(autore, categoria);
        creaArticoloRifiutato(autore, categoria);

        MvcResult result = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-approvazioni")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode punto = objectMapper.readTree(result.getResponse().getContentAsString()).get(0);

        assertThat(punto.get("approvati").asLong()).isEqualTo(approvatiPrima + 1);
        assertThat(punto.get("rifiutati").asLong()).isEqualTo(rifiutatiPrima + 1);
    }

    @Test
    void getAndamentoApprovazioni_clampaLaFinestraA90Giorni_quandoGiorniRichiestiOltreIlMassimo() throws Exception {
        String jwt = creaUtenteELogga("andamento-approvazioni-clamp@provider.it", Ruolo.MANAGER_AUTORI);

        MvcResult result = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-approvazioni")
                        .param("giorni", "365")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode serie = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(serie).hasSize(90);
    }

    // --- GET /statistiche-autori/andamento-letture ----------------------------------------

    @Test
    void getAndamentoLetture_conteggiaNelPuntoDiOggiLaLetturaAppenaGenerata_comeDeltaSullaBaseline() throws Exception {
        String jwt = creaUtenteELogga("andamento-letture-manager@provider.it", Ruolo.MANAGER_AUTORI);
        MvcResult baseline = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-letture")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        long prima = objectMapper.readTree(baseline.getResponse().getContentAsString()).get(0).get("numeroLetture").asLong();

        Utente autore = creaAutore("andamento-letture-autore@provider.it");
        Categoria categoria = creaCategoria("Elettronica", null);
        Articolo articolo = creaArticoloPubblicato(autore, categoria);
        // Lettura generata dal path pubblico reale (Guest, nessun JWT): stessa condizione di
        // GestioneArticoli.getArticleById che scrive la VisualizzazioneArticolo, non un inserimento
        // diretto sul repository.
        mockMvc.perform(get("/api/v1/articoli/{articleId}", articolo.getId()))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-letture")
                        .param("giorni", "1")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode punto = objectMapper.readTree(result.getResponse().getContentAsString()).get(0);

        assertThat(punto.get("data").asText()).isEqualTo(LocalDate.now(ZONA_STATISTICHE).toString());
        assertThat(punto.get("numeroLetture").asLong()).isEqualTo(prima + 1);
    }

    @Test
    void getAndamentoLetture_clampaLaFinestraA90Giorni_quandoGiorniRichiestiOltreIlMassimo() throws Exception {
        String jwt = creaUtenteELogga("andamento-letture-clamp@provider.it", Ruolo.MANAGER_AUTORI);

        MvcResult result = mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-letture")
                        .param("giorni", "365")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode serie = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(serie).hasSize(90);
    }

    // --- GET /statistiche-autori/categorie-piu-lette ----------------------------------------

    @Test
    void getCategoriePiuLette_includeLeVisualizzazioniDellaSottocategoriaNelTotaleDelPadre() throws Exception {
        String jwt = creaUtenteELogga("categorie-piu-lette-manager@provider.it", Ruolo.MANAGER_AUTORI);
        Utente autore = creaAutore("categorie-piu-lette-autore@provider.it");
        // Numero di visualizzazioni molto alto per garantire la presenza in top 10 indipendentemente
        // dai dati residui di altri test sul DB Postgres locale condiviso (stesso motivo di
        // AndamentoStatisticheIntegrationTest).
        Categoria padre = creaCategoria("Padre " + UUID.randomUUID(), null);
        Categoria figlia = creaCategoria("Figlia " + UUID.randomUUID(), padre);
        Articolo articoloPadre = creaArticoloPubblicato(autore, padre);
        ReflectionTestUtils.setField(articoloPadre, "numeroVisualizzazioni", 500_000L);
        articoloRepository.saveAndFlush(articoloPadre);
        Articolo articoloFiglia = creaArticoloPubblicato(autore, figlia);
        ReflectionTestUtils.setField(articoloFiglia, "numeroVisualizzazioni", 300_000L);
        articoloRepository.saveAndFlush(articoloFiglia);

        MvcResult result = mockMvc.perform(get("/api/v1/autori/statistiche-autori/categorie-piu-lette")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode classifica = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode nodoPadre = trovaPerId(classifica, padre.getId());
        JsonNode nodoFiglia = trovaPerId(classifica, figlia.getId());
        assertThat(nodoPadre).isNotNull();
        assertThat(nodoPadre.get("totaleVisualizzazioni").asLong()).isEqualTo(800_000L); // proprio + sottocategoria
        assertThat(nodoFiglia).isNotNull();
        assertThat(nodoFiglia.get("totaleVisualizzazioni").asLong()).isEqualTo(300_000L);
    }

    private static JsonNode trovaPerId(JsonNode array, Long categoriaId) {
        for (JsonNode nodo : array) {
            if (nodo.get("categoriaId").asLong() == categoriaId) {
                return nodo;
            }
        }
        return null;
    }

    // --- controllo di accesso ----------------------------------------

    @Test
    void statisticheAutori_restituiscono403_perUnRuoloDiversoDaManagerAutori() throws Exception {
        String jwt = creaUtenteELogga("statistiche-autori-iscritto@provider.it", Ruolo.ISCRITTO);

        mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-pubblicazioni")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-categorie")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-approvazioni")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/autori/statistiche-autori/andamento-letture")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/autori/statistiche-autori/letture")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/autori/statistiche-autori/categorie-piu-lette")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
    }
}
