package com.motormindhub.Api.web.articoli;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Articolo;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoLista;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.ArticoloSalvatoRepository;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.service.gestioneArticoli.dto.SaveArticleDTO;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GestioneArticoli.saveArticleToList (ODD 2.2) permetteva di salvare in "Preferiti"/"Leggi più
 * tardi" un articolo non ancora PUBBLICATO (bozza o in attesa di approvazione): RF1.2/RF1.7 non
 * prevedono che un Iscritto veda o navighi una bozza altrui, quindi il problema va impedito alla
 * radice qui, non curato a valle quando l'autore poi cancella l'articolo (cfr. il fix gemello su
 * deleteArticle/articoli_salvati). Qui si verifica che il tentativo sia rifiutato esplicitamente
 * (non un 500, non un salvataggio silenzioso) e che nessuna riga venga creata.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SaveArticleToListStatoArticoloIntegrationTest {

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

    private Utente iscritto;
    private Articolo bozza;
    private String iscrittoJwt;

    @BeforeEach
    void setUp() throws Exception {
        Utente autore = creaUtente("autore-save-bozza@provider.it", Ruolo.AUTORE);
        iscritto = creaUtente("iscritto-save-bozza@provider.it", Ruolo.ISCRITTO);

        Categoria categoria = categoriaRepository.saveAndFlush(new Categoria("Carrozzeria", "desc", null));
        bozza = new Articolo(autore, "Bozza non ancora pubblicata", "Testo di prova.", categoria, "carrozzeria", null);
        bozza = articoloRepository.saveAndFlush(bozza); // stato di default del costruttore: BOZZA

        iscrittoJwt = login(iscritto.getEmail());
    }

    private Utente creaUtente(String email, Ruolo ruolo) {
        Utente utente = new Utente("Test", "SaveBozza", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
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
    void salvareUnaBozza_vieneRifiutato_eNonCreaAlcunaRiga() throws Exception {
        mockMvc.perform(post("/api/v1/articoli/{articleId}/salvataggi", bozza.getId())
                        .header("Authorization", "Bearer " + iscrittoJwt)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new SaveArticleDTO(TipoLista.PREFERITI))))
                .andExpect(status().isConflict());

        assertThat(articoloSalvatoRepository.findByUtenteIdAndArticoloIdAndTipoLista(
                iscritto.getId(), bozza.getId(), TipoLista.PREFERITI)).isEmpty();
    }
}
