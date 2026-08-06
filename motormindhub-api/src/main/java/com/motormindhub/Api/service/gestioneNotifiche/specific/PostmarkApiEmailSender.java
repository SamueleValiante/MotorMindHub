package com.motormindhub.Api.service.gestioneNotifiche.specific;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementazione via API HTTP di Postmark (POST /email, porta 443): usata in produzione su
 * Railway, che blocca le connessioni SMTP in uscita sui piani non-Pro (MailConnectException/
 * SocketTimeoutException verso smtp.postmarkapp.com:587, causa nota e documentata dalla piattaforma
 * stessa - cfr. EmailSender). Stesso Server API Token gia' configurato per l'SMTP (spring.mail.
 * password: per convenzione Postmark e' lo stesso valore per entrambi i canali), nessuna nuova
 * credenziale da procurarsi. Attiva solo se app.mail.provider=postmark-api.
 *
 * Il corpo della richiesta e' costruito come Map<String,Object> (non un record annotato con
 * @JsonProperty) deliberatamente: questo progetto ha in classpath sia Jackson 2
 * (com.fasterxml.jackson, via jjwt-jackson) sia Jackson 3 (tools.jackson, il databind gestito da
 * Spring stesso in questa versione - cfr. JsonErrorResponseWriter), e la serializzazione di una Map
 * non richiede annotazioni ne' dipende da quale dei due venga usato dai converter HTTP di
 * RestClient - le chiavi diventano nomi di campo JSON cosi' come scritte.
 */
@Component
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "postmark-api")
public class PostmarkApiEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(PostmarkApiEmailSender.class);

    private final RestClient restClient;
    private final String serverToken;
    private final String mittente;

    public PostmarkApiEmailSender(
            @Value("${app.mail.postmark-api.base-url:https://api.postmarkapp.com}") String baseUrl,
            @Value("${spring.mail.password}") String serverToken,
            @Value("${app.mail.from}") String mittente,
            @Value("${app.mail.postmark-api.connect-timeout-ms:5000}") long connectTimeoutMs,
            @Value("${app.mail.postmark-api.read-timeout-ms:5000}") long readTimeoutMs) {
        this.serverToken = serverToken;
        this.mittente = mittente;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public void send(String destinatario, String oggetto, String corpo) {
        invia(destinatario, oggetto, corpo, null);
    }

    @Override
    public void send(String destinatario, String oggetto, String corpo, String allegatoNome, byte[] allegatoContenuto) {
        Map<String, String> allegato = Map.of(
                "Name", allegatoNome,
                "Content", Base64.getEncoder().encodeToString(allegatoContenuto),
                "ContentType", "application/octet-stream");
        invia(destinatario, oggetto, corpo, List.of(allegato));
    }

    private void invia(String destinatario, String oggetto, String corpo, List<Map<String, String>> allegati) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("From", mittente);
        payload.put("To", destinatario);
        payload.put("Subject", oggetto);
        payload.put("TextBody", corpo);
        payload.put("MessageStream", "outbound");
        if (allegati != null) {
            payload.put("Attachments", allegati);
        }

        try {
            restClient.post()
                    .uri("/email")
                    .header("X-Postmark-Server-Token", serverToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.error("Invio email via Postmark API a {} fallito (oggetto: '{}')", destinatario, oggetto, e);
        }
    }
}
