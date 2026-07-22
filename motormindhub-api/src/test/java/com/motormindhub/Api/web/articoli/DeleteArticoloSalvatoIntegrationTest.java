package com.motormindhub.Api.web.articoli;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Articolo;
import com.motormindhub.Api.model.entity.ArticoloSalvato;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoArticolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoLista;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.ArticoloSalvatoRepository;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GestioneArticoli.deleteArticle (ODD 2.2) falliva con 500 se l'articolo era ancora referenziato da
 * righe in articoli_salvati: la FK articoli_salvati.articolo_id non ha ON DELETE CASCADE (scelta
 * deliberata, coerente con l'approccio del progetto per le cancellazioni con effetti a cascata - cfr.
 * CategoriaEliminataListener - esplicito e tracciabile a livello applicativo invece che implicito
 * nello schema). Qui si verifica che cancellare un articolo salvato da un utente vada a buon fine
 * (non 500) e che il salvataggio non sopravviva alla cancellazione dell'articolo.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DeleteArticoloSalvatoIntegrationTest {

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
    private ArticoloSalvatoRepository articoloSalvatoRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Utente autore;
    private Utente iscritto;
    private Articolo articolo;
    private String autoreJwt;

    @BeforeEach
    void setUp() throws Exception {
        autore = creaUtente("autore-delete-salvato@provider.it", Ruolo.AUTORE);
        iscritto = creaUtente("iscritto-delete-salvato@provider.it", Ruolo.ISCRITTO);

        Categoria categoria = categoriaRepository.saveAndFlush(new Categoria("Elettronica", "desc", null));
        articolo = new Articolo(autore, "Guida diagnosi centraline", "Testo di prova.", categoria, "diagnosi", null);
        articolo.setStato(StatoArticolo.PUBBLICATO);
        articolo = articoloRepository.saveAndFlush(articolo);

        autoreJwt = login(autore.getEmail());

        articoloSalvatoRepository.saveAndFlush(new ArticoloSalvato(iscritto, articolo, TipoLista.PREFERITI));
    }

    private Utente creaUtente(String email, Ruolo ruolo) {
        Utente utente = new Utente("Test", "DeleteSalvato", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
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

    @Test
    void cancellaArticoloSalvatoDaUnUtente_nonRitorna500_eRimuoveIlSalvataggio() throws Exception {
        assertThat(articoloSalvatoRepository.findByUtenteIdAndArticoloIdAndTipoLista(
                iscritto.getId(), articolo.getId(), TipoLista.PREFERITI)).isPresent();

        mockMvc.perform(delete("/api/v1/articoli/{articleId}", articolo.getId())
                        .header("Authorization", "Bearer " + autoreJwt))
                .andExpect(status().isOk());

        assertThat(articoloRepository.findById(articolo.getId())).isEmpty();
        assertThat(articoloSalvatoRepository.findByUtenteIdAndArticoloIdAndTipoLista(
                iscritto.getId(), articolo.getId(), TipoLista.PREFERITI)).isEmpty();
    }
}
