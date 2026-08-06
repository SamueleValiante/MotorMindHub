package com.motormindhub.Api.service.gestioneNotifiche.specific;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * PostmarkApiEmailSender non dipende dal contesto Spring (injection interamente via costruttore,
 * cfr. classe): questi test la istanziano direttamente, come SmtpEmailSenderTest, puntandola verso
 * un server HTTP locale invece del vero Postmark. Stesso principio del ServerSocket "accetta e
 * basta" di MailSmtpTimeoutIntegrationTest per il caso di timeout; per verificare il formato della
 * richiesta si usa invece com.sun.net.httpserver.HttpServer, che permette di ispezionare metodo,
 * path, header e corpo effettivamente inviati da RestClient.
 */
class PostmarkApiEmailSenderTest {

    private static final String SERVER_TOKEN = "test-server-token-123";
    private static final String MITTENTE = "no-reply@motormindhub.it";

    private HttpServer httpServer;
    private ServerSocket serverSocketMuto;

    @AfterEach
    void tearDown() {
        if (httpServer != null) {
            httpServer.stop(0);
        }
        if (serverSocketMuto != null) {
            try {
                serverSocketMuto.close();
            } catch (IOException ignored) {
            }
        }
    }

    @Test
    void send_invocaPostVersoEmailConHeaderETokenCorretti() throws Exception {
        BlockingQueue<RichiestaCatturata> richieste = new ArrayBlockingQueue<>(1);
        httpServer = avviaServerCheCatturaLaRichiesta(richieste, 200);

        PostmarkApiEmailSender sender = new PostmarkApiEmailSender(
                "http://localhost:" + httpServer.getAddress().getPort(),
                SERVER_TOKEN, MITTENTE, 5000, 5000);

        sender.send("marco@provider.it", "Oggetto test", "Corpo test");

        RichiestaCatturata richiesta = richieste.poll(5, TimeUnit.SECONDS);
        assertThat(richiesta).isNotNull();
        assertThat(richiesta.metodo()).isEqualTo("POST");
        assertThat(richiesta.path()).isEqualTo("/email");
        assertThat(richiesta.headerToken()).isEqualTo(SERVER_TOKEN);
        assertThat(richiesta.contentType()).startsWith("application/json");
        assertThat(richiesta.corpo())
                .contains("\"From\":\"" + MITTENTE + "\"")
                .contains("\"To\":\"marco@provider.it\"")
                .contains("\"Subject\":\"Oggetto test\"")
                .contains("\"TextBody\":\"Corpo test\"")
                .contains("\"MessageStream\":\"outbound\"")
                .doesNotContain("\"Attachments\"");
    }

    @Test
    void sendConAllegato_includeLallegatoCodificatoInBase64() throws Exception {
        BlockingQueue<RichiestaCatturata> richieste = new ArrayBlockingQueue<>(1);
        httpServer = avviaServerCheCatturaLaRichiesta(richieste, 200);

        PostmarkApiEmailSender sender = new PostmarkApiEmailSender(
                "http://localhost:" + httpServer.getAddress().getPort(),
                SERVER_TOKEN, MITTENTE, 5000, 5000);

        byte[] contenuto = "{\"a\":1}".getBytes(StandardCharsets.UTF_8);
        sender.send("marco@provider.it", "Dati pronti", "corpo", "dati.json", contenuto);

        RichiestaCatturata richiesta = richieste.poll(5, TimeUnit.SECONDS);
        assertThat(richiesta).isNotNull();
        String base64Atteso = Base64.getEncoder().encodeToString(contenuto);
        assertThat(richiesta.corpo())
                .contains("\"Attachments\"")
                .contains("\"Name\":\"dati.json\"")
                .contains("\"Content\":\"" + base64Atteso + "\"")
                .contains("\"ContentType\":\"application/octet-stream\"");
    }

    @Test
    void send_nonPropagaEccezione_quandoPostmarkRispondeConErrore() throws Exception {
        BlockingQueue<RichiestaCatturata> richieste = new ArrayBlockingQueue<>(1);
        httpServer = avviaServerCheCatturaLaRichiesta(richieste, 422);

        PostmarkApiEmailSender sender = new PostmarkApiEmailSender(
                "http://localhost:" + httpServer.getAddress().getPort(),
                SERVER_TOKEN, MITTENTE, 5000, 5000);

        assertThatCode(() -> sender.send("marco@provider.it", "Oggetto", "Corpo"))
                .doesNotThrowAnyException();
    }

    @Test
    void send_fallisceEntroIlTimeoutConfigurato_quandoLendpointNonRisponde() throws Exception {
        serverSocketMuto = new ServerSocket(0);
        Thread accettaEBasta = new Thread(() -> {
            try {
                serverSocketMuto.accept();
            } catch (IOException ignored) {
            }
        });
        accettaEBasta.setDaemon(true);
        accettaEBasta.start();

        PostmarkApiEmailSender sender = new PostmarkApiEmailSender(
                "http://localhost:" + serverSocketMuto.getLocalPort(),
                SERVER_TOKEN, MITTENTE, 1000, 1000);

        long inizio = System.currentTimeMillis();
        assertThatCode(() -> sender.send("marco@provider.it", "Oggetto", "Corpo"))
                .doesNotThrowAnyException();
        long durataMs = System.currentTimeMillis() - inizio;

        assertThat(durataMs).isLessThan(15_000);
    }

    // --- helper privati -----------------------------------------------------

    private record RichiestaCatturata(String metodo, String path, String headerToken, String contentType, String corpo) {
    }

    private HttpServer avviaServerCheCatturaLaRichiesta(BlockingQueue<RichiestaCatturata> richieste, int statusRisposta) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/email", exchange -> {
            try {
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                exchange.getRequestBody().transferTo(buffer);
                richieste.offer(new RichiestaCatturata(
                        exchange.getRequestMethod(),
                        exchange.getRequestURI().getPath(),
                        exchange.getRequestHeaders().getFirst("X-Postmark-Server-Token"),
                        exchange.getRequestHeaders().getFirst("Content-Type"),
                        buffer.toString(StandardCharsets.UTF_8)));
                byte[] risposta = "{}".getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(statusRisposta, risposta.length);
                exchange.getResponseBody().write(risposta);
            } finally {
                exchange.close();
            }
        });
        server.start();
        return server;
    }
}
