package com.motormindhub.Api.service.gestioneNotifiche;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.net.ServerSocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifica che spring.mail.properties.mail.smtp.{connectiontimeout,timeout,writetimeout}
 * (application.properties) siano davvero applicati al bean JavaMailSender autoconfigurato da
 * Spring Boot: un endpoint che accetta la connessione TCP ma non scrive mai il greeting SMTP
 * ("220 ...") deve far fallire l'invio entro il timeout configurato, non bloccare il chiamante a
 * tempo indeterminato (il rischio concreto e' un thread @Async del pool - GestioneNotifiche,
 * AsyncConfig - mai piu' rilasciato). Un endpoint su porta chiusa fallirebbe invece all'istante
 * con "connection refused", senza esercitare alcun timeout: qui serve un socket che accetta e poi
 * non risponde, cosi' da forzare davvero l'attesa e provare che il timeout la interrompe.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class MailSmtpTimeoutIntegrationTest {

    private static ServerSocket serverSocket;

    @DynamicPropertySource
    static void puntaAUnEndpointCheAccettaMaNonRispondeMai(DynamicPropertyRegistry registry) throws IOException {
        serverSocket = new ServerSocket(0);
        Thread accettaEBasta = new Thread(() -> {
            try {
                serverSocket.accept();
            } catch (IOException ignored) {
                // il test chiude il socket a fine classe: l'IOException dell'accept() interrotto e' attesa
            }
        });
        accettaEBasta.setDaemon(true);
        accettaEBasta.start();

        registry.add("spring.mail.host", () -> "localhost");
        registry.add("spring.mail.port", serverSocket::getLocalPort);
    }

    @AfterAll
    static void chiudiIlSocket() throws IOException {
        serverSocket.close();
    }

    @Autowired
    private JavaMailSender mailSender;

    @Test
    void invioVersoSmtpCheNonRispondeFallisceEntroIlTimeoutConfigurato() {
        SimpleMailMessage messaggio = new SimpleMailMessage();
        messaggio.setFrom("no-reply@motormindhub.it");
        messaggio.setTo("test@provider.it");
        messaggio.setSubject("test timeout");
        messaggio.setText("test timeout");

        long inizio = System.currentTimeMillis();
        assertThatThrownBy(() -> mailSender.send(messaggio)).isInstanceOf(MailException.class);
        long durataMs = System.currentTimeMillis() - inizio;

        // I tre timeout configurati sono 5000ms ciascuno: una soglia larga (15s) distingue comunque
        // un fallimento rapido da un blocco indefinito, senza rendere il test fragile su una CI lenta.
        assertThat(durataMs).isLessThan(15_000);
    }
}
