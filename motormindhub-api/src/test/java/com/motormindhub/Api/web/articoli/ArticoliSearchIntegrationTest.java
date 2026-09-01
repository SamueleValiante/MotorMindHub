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

    private Utente creaAutore(String email) {
        Utente autore = new Utente("Test", "Autore", email,
                passwordEncoder.encode("PasswordValida78!"), null, null, true, null);
        autore.setRuolo(com.motormindhub.Api.model.entity.Ruolo.AUTORE);
        autore.setStato(StatoUtente.ATTIVO);
        return utenteRepository.saveAndFlush(autore);
    }

    private Articolo creaArticoloPubblicato(String titolo, String testo, String tag) {
        Articolo articolo = new Articolo(creaAutore("autore-" + System.nanoTime() + "@provider.it"),
                titolo, testo, categoria, tag, null);
        articolo.setStato(StatoArticolo.PUBBLICATO);
        return articoloRepository.saveAndFlush(articolo);
    }

    /**
     * V19 (SDD 3.3 aggiornato): il corpo dell'articolo (Testo) e' uscito dall'ambito di
     * search_vector, che ora copre solo Titolo e Tag - una parola che compare esclusivamente nel
     * Testo non deve piu' produrre un match.
     */
    @Test
    void parolaSoloNelTesto_nonTrovaPiuArticolo() throws Exception {
        String parolaUnica = "Xyloflangetesto" + System.nanoTime();
        creaArticoloPubblicato("Titolo generico senza la parola", "Testo che contiene " + parolaUnica + " qui.", "tag-generico");

        mockMvc.perform(get("/api/v1/articoli").param("query", parolaUnica))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totaleRisultati").value(0));
    }

    /**
     * Stesso ambito (V19): una parola nel Tag resta nell'ambito della ricerca, a differenza del
     * Testo verificato sopra.
     */
    @Test
    void parolaNelTag_continuaATrovareArticolo() throws Exception {
        String parolaUnica = "Xyloflangetag" + System.nanoTime();
        creaArticoloPubblicato("Titolo generico senza la parola", "Testo generico qualsiasi.", parolaUnica);

        mockMvc.perform(get("/api/v1/articoli").param("query", parolaUnica))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totaleRisultati").value(1));
    }

    /**
     * Prefix-matching sull'ultimo termine (ArticoloRepository.cercaPubblicati): un prefisso di una
     * parola nel Titolo, cosi' come la ricerca live di Esplora lo invia mentre l'utente sta ancora
     * digitando, deve trovare l'articolo anche prima che la parola sia completa.
     */
    @Test
    void prefissoDiParolaNelTitolo_trovaArticolo() throws Exception {
        String parolaUnica = "Xyloflangeprefix" + System.nanoTime();
        creaArticoloPubblicato("Guida " + parolaUnica, "Testo generico qualsiasi.", "tag-generico");
        String prefisso = parolaUnica.substring(0, parolaUnica.length() - 3);

        mockMvc.perform(get("/api/v1/articoli").param("query", prefisso))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totaleRisultati").value(1));
    }

    /**
     * Costruzione sicura della query (ArticoloRepository.cercaPubblicati): caratteri con significato
     * speciale per to_tsquery (& | ! ( )) nell'input utente non devono rompere la query (500) - il
     * termine precedente resta comunque cercabile per intero.
     */
    @Test
    void caratteriSpecialiTsquery_nonRompeLaRicerca() throws Exception {
        String parolaUnica = "Xyloflangespeciali" + System.nanoTime();
        creaArticoloPubblicato("Guida " + parolaUnica, "Testo generico qualsiasi.", "tag-generico");

        mockMvc.perform(get("/api/v1/articoli").param("query", parolaUnica + " & (drop table) | fine"))
                .andExpect(status().isOk());
    }

    /**
     * Ultimo termine che stemma a zero lessemi (stopword italiana, es. "di"): il COALESCE a tsquery
     * vuoto deve comportarsi da neutro rispetto a "&&", non azzerare il match sui termini precedenti.
     */
    @Test
    void ultimoTermineStopword_nonAzzeraIlMatch() throws Exception {
        String parolaUnica = "Xyloflangestopword" + System.nanoTime();
        creaArticoloPubblicato("Guida " + parolaUnica, "Testo generico qualsiasi.", "tag-generico");

        mockMvc.perform(get("/api/v1/articoli").param("query", parolaUnica + " di"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totaleRisultati").value(1));
    }
}
