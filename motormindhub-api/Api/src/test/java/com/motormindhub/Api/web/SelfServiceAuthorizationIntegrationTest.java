package com.motormindhub.Api.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Articolo;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoLista;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.service.gestioneArticoli.dto.SaveArticleDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.ReportUserDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.UpdateProfileDTO;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, filter chain reale - non mock) dei 7 endpoint self-service
 * corretti nell'audit @PreAuthorize (SDD 3.4, Tabella 1): prima del fix ricadevano sul fallback
 * authenticated() di SecurityConfig, accessibili anche da un account GESTORE_UTENTI - fuori dalla
 * catena cumulativa Iscritto/Autore/Manager Autori a cui la matrice li scopa (RAD 3.2.4, Gestore
 * Utenti "distinta e indipendente"). Un test per endpoint: verifica che il ruolo previsto (ISCRITTO)
 * mantenga l'accesso e che GESTORE_UTENTI venga ora respinto con 403.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SelfServiceAuthorizationIntegrationTest {

    private static final String PASSWORD = "PasswordValida78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private ArticoloRepository articoloRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String iscrittoJwt;
    private String gestoreJwt;
    private Long vittimaSegnalazioneId;
    private Long articoloId;

    @BeforeEach
    void creaUtentiDiTest() throws Exception {
        creaUtente("iscritto-authz-test@provider.it", Ruolo.ISCRITTO);
        creaUtente("gestore-authz-test@provider.it", Ruolo.GESTORE_UTENTI);
        vittimaSegnalazioneId = creaUtente("vittima-authz-test@provider.it", Ruolo.ISCRITTO);
        Utente autoreArticolo = utenteRepository.getReferenceById(vittimaSegnalazioneId);
        articoloId = articoloRepository.saveAndFlush(
                new Articolo(autoreArticolo, "Articolo di test", "Testo", null, null, null)).getId();

        iscrittoJwt = login("iscritto-authz-test@provider.it");
        gestoreJwt = login("gestore-authz-test@provider.it");
    }

    private Long creaUtente(String email, Ruolo ruolo) {
        Utente utente = new Utente("Test", "Authz", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(ruolo);
        return utenteRepository.saveAndFlush(utente).getId();
    }

    private String login(String email) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void updateProfile_PUT_me() throws Exception {
        UpdateProfileDTO dto = new UpdateProfileDTO("Nome", "Cognome", null, "Bio");

        mockMvc.perform(put("/api/v1/utenti/me")
                        .header("Authorization", "Bearer " + iscrittoJwt)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/utenti/me")
                        .header("Authorization", "Bearer " + gestoreJwt)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void requestAccountDataExport_POST_meEsportazioneDati() throws Exception {
        mockMvc.perform(post("/api/v1/utenti/me/esportazione-dati")
                        .header("Authorization", "Bearer " + iscrittoJwt))
                .andExpect(status().isAccepted());

        mockMvc.perform(post("/api/v1/utenti/me/esportazione-dati")
                        .header("Authorization", "Bearer " + gestoreJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    void requestAccountDeletion_POST_meCancellazione() throws Exception {
        mockMvc.perform(post("/api/v1/utenti/me/cancellazione")
                        .header("Authorization", "Bearer " + gestoreJwt))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/utenti/me/cancellazione")
                        .header("Authorization", "Bearer " + iscrittoJwt))
                .andExpect(status().isAccepted());
    }

    @Test
    void reportUser_POST_segnalazioni() throws Exception {
        ReportUserDTO dto = new ReportUserDTO(vittimaSegnalazioneId, "Motivazione di test");

        mockMvc.perform(post("/api/v1/utenti/segnalazioni")
                        .header("Authorization", "Bearer " + iscrittoJwt)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/utenti/segnalazioni")
                        .header("Authorization", "Bearer " + gestoreJwt)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getSavedArticles_GET_articoliSalvataggi() throws Exception {
        mockMvc.perform(get("/api/v1/articoli/salvataggi")
                        .header("Authorization", "Bearer " + iscrittoJwt))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/articoli/salvataggi")
                        .header("Authorization", "Bearer " + gestoreJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    void saveArticleToList_POST_articoliSalvataggi() throws Exception {
        SaveArticleDTO dto = new SaveArticleDTO(TipoLista.PREFERITI);

        mockMvc.perform(post("/api/v1/articoli/" + articoloId + "/salvataggi")
                        .header("Authorization", "Bearer " + gestoreJwt)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/articoli/" + articoloId + "/salvataggi")
                        .header("Authorization", "Bearer " + iscrittoJwt)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void removeArticleFromList_DELETE_articoliSalvataggi() throws Exception {
        // Precondizione per il caso di successo: l'articolo deve gia' essere salvato in lista,
        // altrimenti il service risponde 404 (ArticoloNonSalvatoException) indipendentemente
        // dall'autorizzazione - qui si vuole isolare solo il comportamento di @PreAuthorize.
        mockMvc.perform(post("/api/v1/articoli/" + articoloId + "/salvataggi")
                        .header("Authorization", "Bearer " + iscrittoJwt)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new SaveArticleDTO(TipoLista.LEGGI_PIU_TARDI))))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/v1/articoli/" + articoloId + "/salvataggi/LEGGI_PIU_TARDI")
                        .header("Authorization", "Bearer " + gestoreJwt))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/articoli/" + articoloId + "/salvataggi/LEGGI_PIU_TARDI")
                        .header("Authorization", "Bearer " + iscrittoJwt))
                .andExpect(status().isOk());
    }
}
