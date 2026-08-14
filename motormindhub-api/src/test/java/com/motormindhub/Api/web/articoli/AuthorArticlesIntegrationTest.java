package com.motormindhub.Api.web.articoli;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Articolo;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoArticolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoLista;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.service.gestioneArticoli.dto.SaveArticleDTO;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end (contesto Spring reale, DB Postgres reale) di GET /api/v1/articoli/me ("I Miei
 * Articoli", ODD 2.2 getArticlesByAuthor): verifica che numeroSalvataggi rifletta i salvataggi reali
 * (Preferiti + Leggi più tardi combinati in un unico totale, ArticoloSalvatoRepository.countByArticoloIdIn)
 * contro Postgres vero, non un repository mockato - quella logica di aggregazione/zero-default è già
 * coperta deterministicamente da GestioneArticoliTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthorArticlesIntegrationTest {

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
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Utente creaUtente(String email, Ruolo ruolo) {
        Utente utente = new Utente("Test", "Utente", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(ruolo);
        return utenteRepository.saveAndFlush(utente);
    }

    private String logga(String email) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private void salva(String jwtIscritto, Long articleId, TipoLista tipoLista) throws Exception {
        mockMvc.perform(post("/api/v1/articoli/" + articleId + "/salvataggi")
                        .contentType("application/json")
                        .header("Authorization", "Bearer " + jwtIscritto)
                        .content(objectMapper.writeValueAsString(new SaveArticleDTO(tipoLista))))
                .andExpect(status().isCreated());
    }

    private JsonNode trovaPerId(JsonNode array, Long articleId) {
        for (JsonNode nodo : array) {
            if (nodo.get("articolo").get("id").asLong() == articleId) {
                return nodo;
            }
        }
        return null;
    }

    @Test
    void getArticlesByAuthor_conteggiaISalvataggiReali_combinandoPreferitiELeggiPiuTardi() throws Exception {
        Utente autore = creaUtente("autore-mieiarticoli-salvataggi@provider.it", Ruolo.AUTORE);
        Categoria categoria = categoriaRepository.saveAndFlush(new Categoria("Elettronica", "desc", null));
        Articolo articoloSalvato = new Articolo(autore, "Guida diagnosi centralina", "Testo di prova.", categoria, "elettronica", null);
        articoloSalvato.setStato(StatoArticolo.PUBBLICATO);
        articoloSalvato = articoloRepository.saveAndFlush(articoloSalvato);
        Articolo articoloMaiSalvato = new Articolo(autore, "Guida cambio olio", "Testo di prova.", categoria, "manutenzione", null);
        articoloMaiSalvato.setStato(StatoArticolo.PUBBLICATO);
        articoloMaiSalvato = articoloRepository.saveAndFlush(articoloMaiSalvato);

        Utente lettore1 = creaUtente("iscritto1-mieiarticoli-salvataggi@provider.it", Ruolo.ISCRITTO);
        Utente lettore2 = creaUtente("iscritto2-mieiarticoli-salvataggi@provider.it", Ruolo.ISCRITTO);
        String jwtLettore1 = logga(lettore1.getEmail());
        String jwtLettore2 = logga(lettore2.getEmail());
        salva(jwtLettore1, articoloSalvato.getId(), TipoLista.PREFERITI);
        salva(jwtLettore2, articoloSalvato.getId(), TipoLista.LEGGI_PIU_TARDI);

        String jwtAutore = logga(autore.getEmail());
        MvcResult result = mockMvc.perform(get("/api/v1/articoli/me")
                        .header("Authorization", "Bearer " + jwtAutore))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode elenco = objectMapper.readTree(result.getResponse().getContentAsString());

        JsonNode nodoSalvato = trovaPerId(elenco, articoloSalvato.getId());
        assertThat(nodoSalvato).isNotNull();
        assertThat(nodoSalvato.get("numeroSalvataggi").asLong()).isEqualTo(2L); // Preferiti + Leggi più tardi, combinati
        JsonNode nodoMaiSalvato = trovaPerId(elenco, articoloMaiSalvato.getId());
        assertThat(nodoMaiSalvato).isNotNull();
        assertThat(nodoMaiSalvato.get("numeroSalvataggi").asLong()).isZero(); // 0, non null e non errore
    }

    @Test
    void getArticlesByAuthor_restringeAlChiamante_unAltroAutoreNonVedeIMieiArticoli() throws Exception {
        Utente autore = creaUtente("autore-scoping@provider.it", Ruolo.AUTORE);
        Utente altroAutore = creaUtente("altro-autore-scoping@provider.it", Ruolo.AUTORE);
        Categoria categoria = categoriaRepository.saveAndFlush(new Categoria("Pneumatici", "desc", null));
        Articolo articolo = new Articolo(autore, "Guida scelta pneumatici", "Testo di prova.", categoria, "pneumatici", null);
        articolo.setStato(StatoArticolo.PUBBLICATO);
        articoloRepository.saveAndFlush(articolo);

        String jwtAltroAutore = logga(altroAutore.getEmail());
        MvcResult result = mockMvc.perform(get("/api/v1/articoli/me")
                        .header("Authorization", "Bearer " + jwtAltroAutore))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode elenco = objectMapper.readTree(result.getResponse().getContentAsString());

        assertThat(trovaPerId(elenco, articolo.getId())).isNull(); // endpoint scoping per principal.getId(), non un filtro lato client
    }
}
