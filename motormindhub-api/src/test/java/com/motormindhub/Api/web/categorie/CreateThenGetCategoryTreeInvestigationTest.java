package com.motormindhub.Api.web.categorie;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Riproduzione minimale (NON @Transactional a livello di classe, deliberatamente): un create e una
 * get, in sequenza stretta, ciascuno come richiesta HTTP indipendente (ognuna con la propria
 * transazione/connessione top-level, esattamente come in produzione). Se la classe fosse
 * @Transactional, entrambe le chiamate condividerebbero la stessa transazione/connessione del test
 * e il bug (se di natura transazionale) non potrebbe mai manifestarsi - mascherandolo invece di
 * riprodurlo.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CreateThenGetCategoryTreeInvestigationTest {

    private static final String PASSWORD = "PasswordValida78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @AfterEach
    void pulisci() {
        // Solo le categorie: l'utente ha un refresh_token collegato (vincolo FK) dal login reale
        // fatto nel test, ripulirlo non serve a isolare la prossima esecuzione.
        categoriaRepository.deleteAll();
    }

    private String creaAutoreELogga(String email) throws Exception {
        Utente utente = new Utente("Autore", "Test", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(Ruolo.AUTORE);
        utenteRepository.saveAndFlush(utente);

        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void categoriaAppenaCreata_eSubitoVisibileInUnaGetSuccessiva_singolaSequenzaSenzaConcorrenza() throws Exception {
        String jwt = creaAutoreELogga("investigation-autore-" + System.nanoTime() + "@provider.it");
        String nomeCategoria = "Categoria-Investigazione-" + System.nanoTime();

        mockMvc.perform(post("/api/v1/categorie")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType("application/json")
                        .content("{\"nome\":\"" + nomeCategoria + "\",\"descrizione\":\"test\",\"categoriaPadreId\":null}"))
                .andExpect(status().isCreated());

        var result = mockMvc.perform(get("/api/v1/categorie"))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body)
                .as("la categoria appena creata, in una GET immediatamente successiva sulla stessa sequenza (nessuna concorrenza)")
                .contains(nomeCategoria);
    }
}
