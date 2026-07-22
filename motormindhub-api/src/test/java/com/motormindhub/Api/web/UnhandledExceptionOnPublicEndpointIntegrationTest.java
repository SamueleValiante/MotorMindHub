package com.motormindhub.Api.web;

import com.motormindhub.Api.service.gestioneCategorie.GestioneCategorie;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Un'eccezione runtime non gestita su un endpoint permitAll (qui: GET /api/v1/categorie, forzata
 * sostituendo GestioneCategorie con un mock che lancia) non deve mai risultare in un 401. Prima
 * dell'introduzione di GlobalExceptionHandler.handleErroreInterno e di
 * SecurityConfig.dispatcherTypeMatchers(ERROR).permitAll(), il forward interno di Spring Boot verso
 * /error (via ErrorPageFilter, un meccanismo del vero container servlet - per questo qui serve un
 * webEnvironment reale, non MockMvc, che non lo replica) ripassava per la filter chain di sicurezza
 * come richiesta anonima su anyRequest().authenticated(): RestAuthenticationEntryPoint rispondeva
 * 401, mascherando un errore 500 reale da un problema di autenticazione che l'endpoint, essendo
 * pubblico, non ha mai avuto.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UnhandledExceptionOnPublicEndpointIntegrationTest {

    @LocalServerPort
    private int port;
    @MockitoBean
    private GestioneCategorie gestioneCategorie;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Test
    void eccezioneNonGestitaSuEndpointPubblico_nonRitornaMai401() throws Exception {
        when(gestioneCategorie.getCategoryTree()).thenThrow(new RuntimeException("errore inatteso simulato"));

        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/categorie"))
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode())
                .as("un errore interno reale non deve mai essere mascherato da un 401/403 di autenticazione/autorizzazione")
                .isNotIn(401, 403);
        assertThat(response.statusCode()).isEqualTo(500);
        assertThat(response.body()).contains("\"status\":500");
    }
}
