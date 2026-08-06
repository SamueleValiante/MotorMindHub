package com.motormindhub.Api.service.gestioneNotifiche.specific;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Implementazione via SMTP puro (JavaMailSender, spring.mail.* in application.properties): usata
 * per lo sviluppo locale con Mailpit. Non l'implementazione di produzione (Railway blocca le
 * connessioni SMTP in uscita sui piani non-Pro, cfr. EmailSender) - attiva solo se
 * app.mail.provider=smtp, il default per non richiedere configurazione aggiuntiva in locale.
 */
@Component
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "smtp", matchIfMissing = true)
public class SmtpEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailSender.class);

    private final JavaMailSender mailSender;
    private final String mittente;

    public SmtpEmailSender(JavaMailSender mailSender, @Value("${app.mail.from}") String mittente) {
        this.mailSender = mailSender;
        this.mittente = mittente;
    }

    @Override
    public void send(String destinatario, String oggetto, String corpo) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mittente);
        message.setTo(destinatario);
        message.setSubject(oggetto);
        message.setText(corpo);
        try {
            mailSender.send(message);
        } catch (MailException e) {
            log.error("Invio email SMTP a {} fallito (oggetto: '{}')", destinatario, oggetto, e);
        }
    }

    @Override
    public void send(String destinatario, String oggetto, String corpo, String allegatoNome, byte[] allegatoContenuto) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mittente);
            helper.setTo(destinatario);
            helper.setSubject(oggetto);
            helper.setText(corpo);
            helper.addAttachment(allegatoNome, new ByteArrayResource(allegatoContenuto));
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            log.error("Impossibile costruire l'email SMTP con allegato per {}", destinatario, e);
        } catch (MailException e) {
            log.error("Invio email SMTP con allegato a {} fallito", destinatario, e);
        }
    }
}
