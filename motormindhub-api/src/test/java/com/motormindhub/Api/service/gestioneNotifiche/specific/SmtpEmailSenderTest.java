package com.motormindhub.Api.service.gestioneNotifiche.specific;

import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unica implementazione EmailSender usata in sviluppo locale (Mailpit): verifica sia la costruzione
 * del messaggio SMTP (semplice e con allegato) sia il contratto "non propaga mai un'eccezione"
 * dichiarato su EmailSender - stesso livello di dettaglio gia' coperto in precedenza da
 * GestioneNotificheTest quando dipendeva direttamente da JavaMailSender, ora spostato qui insieme
 * alla responsabilita' stessa.
 */
@ExtendWith(MockitoExtension.class)
class SmtpEmailSenderTest {

    private static final String MITTENTE = "no-reply@motormindhub.it";

    @Mock
    private JavaMailSender mailSender;

    private SmtpEmailSender smtpEmailSender;

    @BeforeEach
    void setUp() {
        smtpEmailSender = new SmtpEmailSender(mailSender, MITTENTE);
    }

    @Test
    void send_costruisceUnSimpleMailMessageCorretto() {
        smtpEmailSender.send("marco@provider.it", "Oggetto test", "Corpo test");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage messaggio = captor.getValue();
        assertThat(messaggio.getFrom()).isEqualTo(MITTENTE);
        assertThat(messaggio.getTo()).containsExactly("marco@provider.it");
        assertThat(messaggio.getSubject()).isEqualTo("Oggetto test");
        assertThat(messaggio.getText()).isEqualTo("Corpo test");
    }

    @Test
    void send_nonPropagaEccezione_quandoLinvioFallisce() {
        doThrow(new MailSendException("SMTP non raggiungibile")).when(mailSender).send(any(SimpleMailMessage.class));

        assertThatCode(() -> smtpEmailSender.send("marco@provider.it", "Oggetto", "Corpo"))
                .doesNotThrowAnyException();
    }

    @Test
    void sendConAllegato_costruisceUnMimeMessageConAllegato() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(new JavaMailSenderImpl().createMimeMessage());

        smtpEmailSender.send("marco@provider.it", "Dati pronti", "corpo del messaggio",
                "dati.json", "{\"a\":1}".getBytes(StandardCharsets.UTF_8));

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        MimeMessage inviato = captor.getValue();
        assertThat(inviato.getAllRecipients()[0].toString()).isEqualTo("marco@provider.it");
        assertThat(inviato.getSubject()).isEqualTo("Dati pronti");
        assertThat(inviato.getContent()).isInstanceOf(MimeMultipart.class);
        MimeMultipart contenuto = (MimeMultipart) inviato.getContent();
        assertThat(contenuto.getCount()).isEqualTo(2); // corpo testuale + allegato
        assertThat(contenuto.getBodyPart(1).getFileName()).isEqualTo("dati.json");
    }

    @Test
    void sendConAllegato_nonPropagaEccezione_quandoLinvioFallisce() {
        when(mailSender.createMimeMessage()).thenReturn(new JavaMailSenderImpl().createMimeMessage());
        doThrow(new MailSendException("SMTP non raggiungibile")).when(mailSender).send(any(MimeMessage.class));

        assertThatCode(() -> smtpEmailSender.send("marco@provider.it", "Dati pronti", "corpo",
                "dati.json", "{}".getBytes(StandardCharsets.UTF_8)))
                .doesNotThrowAnyException();
    }
}
