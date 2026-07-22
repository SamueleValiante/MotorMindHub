package com.motormindhub.Api.web.articoli;

import com.motormindhub.Api.model.entity.Articolo;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.entity.StatoArticolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GET /api/v1/articoli (ODD 2.2 searchArticles, ArticoloRepository.cercaPubblicati): il caso
 * "nessun filtro" (query e categoriaIds entrambi assenti, quindi entrambi null lato repository) e'
 * il path piu' comune in assoluto per un endpoint pubblico di listing - e in passato falliva con
 * 500 ("could not determine data type of parameter") perche' la query nativa confrontava un bind
 * parameter nullo con IS NULL senza alcun contesto di tipo esplicito, in una posizione diversa da
 * quella in cui il tipo era altrimenti inferibile (es. = ANY(:categoriaIds)).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ArticoliSearchIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;
    @Autowired
    private ArticoloRepository articoloRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private Categoria categoria;

    @BeforeEach
    void setUp() {
        Utente autore = new Utente("Test", "Autore", "autore-ricerca-articoli@provider.it",
                passwordEncoder.encode("PasswordValida78!"), null, null, true, null);
        autore.setRuolo(com.motormindhub.Api.model.entity.Ruolo.AUTORE);
        autore.setStato(StatoUtente.ATTIVO);
        autore = utenteRepository.saveAndFlush(autore);

        categoria = categoriaRepository.saveAndFlush(new Categoria("Motori", "Categoria di test", null));

        Articolo articolo = new Articolo(autore, "Guida ai motori diesel", "Testo di prova sui motori diesel.",
                categoria, "diesel,motori", null);
        articolo.setStato(StatoArticolo.PUBBLICATO);
        articoloRepository.saveAndFlush(articolo);
    }

    @Test
    void nessunFiltro_rispondeOkConRisultati_nonErrore500() throws Exception {
        mockMvc.perform(get("/api/v1/articoli"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.articoli").isNotEmpty())
                .andExpect(jsonPath("$.totaleRisultati").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    void filtroPerCategoria_continuaAFunzionare() throws Exception {
        mockMvc.perform(get("/api/v1/articoli").param("categoriaIds", categoria.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.articoli").isNotEmpty())
                .andExpect(jsonPath("$.articoli[0].categoriaId").value(categoria.getId()));
    }
}
