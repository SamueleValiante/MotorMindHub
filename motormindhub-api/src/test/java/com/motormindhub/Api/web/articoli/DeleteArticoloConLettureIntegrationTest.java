package com.motormindhub.Api.web.articoli;

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
import com.motormindhub.Api.model.repository.VisualizzazioneArticoloRepository;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GestioneArticoli.deleteArticle (ODD 2.2) fallirebbe con 500 se l'articolo fosse ancora
 * referenziato da righe in visualizzazioni_articolo: la FK visualizzazioni_articolo.articolo_id non
 * ha ON DELETE CASCADE (stessa scelta deliberata di articoli_salvati, cfr.
 * DeleteArticoloSalvatoIntegrationTest - esplicito e tracciabile a livello applicativo invece che
 * implicito nello schema). Qui si verifica che cancellare un articolo con almeno una lettura
 * registrata vada a buon fine (non 500) e che il log non sopravviva alla cancellazione dell'articolo.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DeleteArticoloConLettureIntegrationTest {

    private static final String PASSWORD = "PasswordValida78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;
    @Autowired
    private ArticoloRepository articoloRepository;
    @Autowired
    private VisualizzazioneArticoloRepository visualizzazioneArticoloRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Utente autore;
    private Articolo articolo;
    private String autoreJwt;

    @BeforeEach
    void setUp() throws Exception {
        autore = creaUtente("autore-delete-letture@provider.it", Ruolo.AUTORE);

        Categoria categoria = categoriaRepository.saveAndFlush(new Categoria("Motori", "desc", null));
        articolo = new Articolo(autore, "Guida messa a punto motore", "Testo di prova.", categoria, "motori", null);
        articolo.setStato(StatoArticolo.PUBBLICATO);
        articolo = articoloRepository.saveAndFlush(articolo);

        autoreJwt = login(autore.getEmail());

        // Lettura reale generata dal path pubblico (Guest, nessun JWT): stessa condizione di
        // GestioneArticoli.getArticleById che scrive la VisualizzazioneArticolo, non un inserimento
        // diretto sul repository - prova che il fix copre il flusso end-to-end reale.
        mockMvc.perform(get("/api/v1/articoli/{articleId}", articolo.getId()))
                .andExpect(status().isOk());
    }

    private Utente creaUtente(String email, Ruolo ruolo) {
        Utente utente = new Utente("Test", "DeleteLetture", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(ruolo);
        return utenteRepository.saveAndFlush(utente);
    }

    private String login(String email) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private long contaLettureDiQuestoArticolo() {
        return visualizzazioneArticoloRepository.findAll().stream()
                .filter(v -> v.getArticolo().getId().equals(articolo.getId()))
                .count();
    }

    @Test
    void cancellaArticoloConLettureRegistrate_nonRitorna500_eRimuoveIlLog() throws Exception {
        assertThat(contaLettureDiQuestoArticolo()).isEqualTo(1L);

        mockMvc.perform(delete("/api/v1/articoli/{articleId}", articolo.getId())
                        .header("Authorization", "Bearer " + autoreJwt))
                .andExpect(status().isOk());

        assertThat(articoloRepository.findById(articolo.getId())).isEmpty();
        assertThat(contaLettureDiQuestoArticolo()).isZero();
    }
}
