package com.motormindhub.Api.web.categorie;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Stesso oggetto di indagine di CreateThenGetCategoryTreeInvestigationTest, ma con
 * webEnvironment=RANDOM_PORT e un vero HttpClient: nessuna scorciatoia di MockMvc (dispatch diretto
 * nello stesso thread, nessun vero socket) - qui ogni richiesta passa davvero per il connector HTTP
 * reale (Tomcat embedded), la connessione JDBC viene presa/rilasciata dal pool Hikari esattamente
 * come in produzione. Include anche un caso di concorrenza reale (N thread, ciascuno crea+legge).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CreateThenGetCategoryTreeRealHttpInvestigationTest {

    private static final String PASSWORD = "PasswordValida78!";

    @LocalServerPort
    private int port;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @AfterEach
    void pulisci() {
        categoriaRepository.deleteAll();
    }

    private String creaAutoreELogga(String email) throws Exception {
        Utente utente = new Utente("Autore", "Test", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(Ruolo.AUTORE);
        utenteRepository.saveAndFlush(utente);

        HttpRequest loginRequest = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .build();
        HttpResponse<String> loginResponse = httpClient.send(loginRequest, HttpResponse.BodyHandlers.ofString());
        assertThat(loginResponse.statusCode()).isEqualTo(200);
        return objectMapper.readTree(loginResponse.body()).get("accessToken").asText();
    }

    private int creaCategoria(String jwt, String nome) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/categorie"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + jwt)
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"nome\":\"" + nome + "\",\"descrizione\":\"test\",\"categoriaPadreId\":null}"))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString()).statusCode();
    }

    private String getCategoryTreeBody() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/categorie"))
                .GET().build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString()).body();
    }

    @Test
    void categoriaAppenaCreata_eSubitoVisibileInUnaGetSuccessiva_veroSocketHttp_nessunaConcorrenza() throws Exception {
        String jwt = creaAutoreELogga("investigation-http-" + System.nanoTime() + "@provider.it");
        String nomeCategoria = "Categoria-Investigazione-Http-" + System.nanoTime();

        int status = creaCategoria(jwt, nomeCategoria);
        assertThat(status).isEqualTo(201);

        String body = getCategoryTreeBody();
        assertThat(body).contains(nomeCategoria);
    }

    @Test
    void sottocategoriaAppenaCreata_eSubitoVisibileNelRamoDelPadre_veroSocketHttp() throws Exception {
        String jwt = creaAutoreELogga("investigation-http-sub-" + System.nanoTime() + "@provider.it");
        String nomePadre = "Categoria-Padre-" + System.nanoTime();
        assertThat(creaCategoria(jwt, nomePadre)).isEqualTo(201);

        String alberoConPadre = getCategoryTreeBody();
        JsonNode radici = objectMapper.readTree(alberoConPadre);
        int padreId = java.util.stream.StreamSupport.stream(radici.spliterator(), false)
                .filter(nodo -> nodo.get("nome").asText().equals(nomePadre))
                .findFirst().orElseThrow().get("id").asInt();

        String nomeFiglia = "Categoria-Figlia-" + System.nanoTime();
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/categorie"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + jwt)
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"nome\":\"" + nomeFiglia + "\",\"descrizione\":\"test\",\"categoriaPadreId\":" + padreId + "}"))
                .build();
        assertThat(httpClient.send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(201);

        String body = getCategoryTreeBody();
        assertThat(body).contains(nomeFiglia);
    }

    @Test
    void creazioniConcorrenti_sonoTutteVisibiliInUnaGetSuccessivaAllaFineDiTutte() throws Exception {
        int numThread = 10;
        String jwt = creaAutoreELogga("investigation-http-concorrenza-" + System.nanoTime() + "@provider.it");
        String prefisso = "Categoria-Concorrenza-" + System.nanoTime() + "-";

        ExecutorService pool = Executors.newFixedThreadPool(numThread);
        CountDownLatch viaLibera = new CountDownLatch(1);
        AtomicInteger falliti = new AtomicInteger(0);
        List<Runnable> compiti = java.util.stream.IntStream.range(0, numThread)
                .<Runnable>mapToObj(i -> () -> {
                    try {
                        viaLibera.await();
                        int status = creaCategoria(jwt, prefisso + i);
                        if (status != 201) {
                            falliti.incrementAndGet();
                        }
                    } catch (Exception e) {
                        falliti.incrementAndGet();
                    }
                })
                .toList();
        compiti.forEach(pool::execute);
        viaLibera.countDown();
        pool.shutdown();
        assertThat(pool.awaitTermination(30, TimeUnit.SECONDS)).isTrue();
        assertThat(falliti.get()).isZero();

        String body = getCategoryTreeBody();
        JsonNode radici = objectMapper.readTree(body);
        long trovate = java.util.stream.StreamSupport.stream(radici.spliterator(), false)
                .filter(nodo -> nodo.get("nome").asText().startsWith(prefisso))
                .count();

        assertThat(trovate)
                .as("tutte le %d categorie create concorrentemente devono comparire in una GET eseguita dopo che tutte le create sono completate", numThread)
                .isEqualTo(numThread);
    }
}
