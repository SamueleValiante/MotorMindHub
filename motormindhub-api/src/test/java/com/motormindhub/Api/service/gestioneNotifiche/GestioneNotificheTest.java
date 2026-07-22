package com.motormindhub.Api.service.gestioneNotifiche;

import com.motormindhub.Api.events.AccountCancellatoEvent;
import com.motormindhub.Api.events.AccountRiattivatoEvent;
import com.motormindhub.Api.events.AccountSospesoEvent;
import com.motormindhub.Api.events.ArticoloRecensitoEvent;
import com.motormindhub.Api.events.AutoreInvitatoEvent;
import com.motormindhub.Api.events.BruteForceLockoutEvent;
import com.motormindhub.Api.events.DataExportReadyEvent;
import com.motormindhub.Api.events.PasswordResetRequestedEvent;
import com.motormindhub.Api.events.RichiestaModificaProfiloEvent;
import com.motormindhub.Api.events.UtenteRegistratoEvent;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Un test per ciascun listener di GestioneNotifiche (ODD 2.6): non esistono contratti OCL formali
 * (il sottosistema non ha stato persistente proprio), quindi ogni test verifica solo che, ricevuto
 * l'evento, venga inviata un'email al destinatario atteso con oggetto/contenuto coerenti - non la
 * consegna reale (coperta invece da verifica manuale su Mailpit, localhost:8025).
 */
@ExtendWith(MockitoExtension.class)
class GestioneNotificheTest {

    private static final String MITTENTE = "no-reply@motormindhub.it";
    private static final String FRONTEND_BASE_URL = "http://localhost:3000";
    private static final String NOTIFICHE_INTERNE = "gestore-utenti@motormindhub.it";

    @Mock
    private JavaMailSender mailSender;

    private GestioneNotifiche gestioneNotifiche;

    @BeforeEach
    void setUp() {
        gestioneNotifiche = new GestioneNotifiche(mailSender, MITTENTE, FRONTEND_BASE_URL, NOTIFICHE_INTERNE);
    }

    @Test
    void onUserRegistered_inviaEmailDiVerificaConLinkToken() {
        gestioneNotifiche.onUserRegistered(new UtenteRegistratoEvent(1L, "marco@provider.it", "Marco", "tok-verifica"));

        SimpleMailMessage messaggio = catturaMessaggioSemplice();
        assertThat(messaggio.getTo()).containsExactly("marco@provider.it");
        assertThat(messaggio.getFrom()).isEqualTo(MITTENTE);
        assertThat(messaggio.getSubject()).containsIgnoringCase("conferma");
        assertThat(messaggio.getText()).contains(FRONTEND_BASE_URL + "/conferma-email?token=tok-verifica");
    }

    @Test
    void onPasswordResetRequested_inviaEmailConLinkDiRecupero() {
        gestioneNotifiche.onPasswordResetRequested(new PasswordResetRequestedEvent(1L, "marco@provider.it", "tok-reset"));

        SimpleMailMessage messaggio = catturaMessaggioSemplice();
        assertThat(messaggio.getTo()).containsExactly("marco@provider.it");
        assertThat(messaggio.getText()).contains(FRONTEND_BASE_URL + "/reimposta-password?token=tok-reset");
    }

    @Test
    void onAuthorInvited_inviaEmailDiInvitoConLinkToken() {
        gestioneNotifiche.onAuthorInvited(new AutoreInvitatoEvent(1L, "Giulia", "giulia@provider.it", "tok-invito"));

        SimpleMailMessage messaggio = catturaMessaggioSemplice();
        assertThat(messaggio.getTo()).containsExactly("giulia@provider.it");
        assertThat(messaggio.getText()).contains(FRONTEND_BASE_URL + "/inviti/tok-invito/accetta");
    }

    @Test
    void onArticleReviewed_inviaEmailDiApprovazione_quandoApprovato() {
        gestioneNotifiche.onArticleReviewed(new ArticoloRecensitoEvent(10L, 1L, "autore@provider.it", true, null));

        SimpleMailMessage messaggio = catturaMessaggioSemplice();
        assertThat(messaggio.getTo()).containsExactly("autore@provider.it");
        assertThat(messaggio.getSubject()).containsIgnoringCase("approvato");
    }

    @Test
    void onArticleReviewed_inviaEmailDiRifiutoConMotivazione_quandoRifiutato() {
        gestioneNotifiche.onArticleReviewed(new ArticoloRecensitoEvent(10L, 1L, "autore@provider.it", false, "Fonti non verificabili"));

        SimpleMailMessage messaggio = catturaMessaggioSemplice();
        assertThat(messaggio.getSubject()).containsIgnoringCase("rifiutato");
        assertThat(messaggio.getText()).contains("Fonti non verificabili");
    }

    @Test
    void onAccountSuspended_inviaEmailConMotivazioneEDurata() {
        gestioneNotifiche.onAccountSuspended(new AccountSospesoEvent(1L, "paolo@provider.it", "Contenuti inappropriati", 30));

        SimpleMailMessage messaggio = catturaMessaggioSemplice();
        assertThat(messaggio.getTo()).containsExactly("paolo@provider.it");
        assertThat(messaggio.getText()).contains("Contenuti inappropriati").contains("30 giorni");
    }

    @Test
    void onAccountSuspended_indicaSospensionePermanente_quandoDurataNulla() {
        gestioneNotifiche.onAccountSuspended(new AccountSospesoEvent(1L, "paolo@provider.it", "Violazione grave", null));

        SimpleMailMessage messaggio = catturaMessaggioSemplice();
        assertThat(messaggio.getText()).containsIgnoringCase("tempo indeterminato");
    }

    @Test
    void onAccountReactivated_inviaEmailDiRiattivazione() {
        gestioneNotifiche.onAccountReactivated(new AccountRiattivatoEvent(1L, "paolo@provider.it"));

        SimpleMailMessage messaggio = catturaMessaggioSemplice();
        assertThat(messaggio.getTo()).containsExactly("paolo@provider.it");
        assertThat(messaggio.getSubject()).containsIgnoringCase("riattivato");
    }

    @Test
    void onReportResolutionRequested_inviaEmailConGiorniPerLaModifica() {
        gestioneNotifiche.onReportResolutionRequested(new RichiestaModificaProfiloEvent(2L, "xracer@provider.it", 7));

        SimpleMailMessage messaggio = catturaMessaggioSemplice();
        assertThat(messaggio.getTo()).containsExactly("xracer@provider.it");
        assertThat(messaggio.getText()).contains("7 giorni");
    }

    @Test
    void onBruteForceLockout_inviaEmailConLinkDiSblocco() {
        gestioneNotifiche.onBruteForceLockout(new BruteForceLockoutEvent(1L, "marco@provider.it", "tok-sblocco"));

        SimpleMailMessage messaggio = catturaMessaggioSemplice();
        assertThat(messaggio.getTo()).containsExactly("marco@provider.it");
        assertThat(messaggio.getText()).contains(FRONTEND_BASE_URL + "/sblocco-account?token=tok-sblocco");
    }

    @Test
    void onAccountCancellato_inviaConfermaAllUtenteECopiaInternaAlGestore() {
        gestioneNotifiche.onAccountCancellato(new AccountCancellatoEvent(7L, "email-originale@provider.it"));

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(2)).send(captor.capture());
        var messaggi = captor.getAllValues();

        assertThat(messaggi).anySatisfy(m -> {
            assertThat(m.getTo()).containsExactly("email-originale@provider.it");
            assertThat(m.getSubject()).containsIgnoringCase("conferma");
        });
        assertThat(messaggi).anySatisfy(m -> {
            assertThat(m.getTo()).containsExactly(NOTIFICHE_INTERNE);
            assertThat(m.getText()).contains("email-originale@provider.it").contains("7");
        });
    }

    @Test
    void onDataExportReady_inviaEmailConDatiEsportatiInAllegato() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(nuovoMimeMessageReale());

        gestioneNotifiche.onDataExportReady(new DataExportReadyEvent(1L, "marco@provider.it",
                "{\"nome\":\"Marco\",\"email\":\"marco@provider.it\"}"));

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        MimeMessage inviato = captor.getValue();
        assertThat(inviato.getAllRecipients()[0].toString()).isEqualTo("marco@provider.it");
        assertThat(inviato.getSubject()).containsIgnoringCase("dati");
        assertThat(inviato.getContent()).isInstanceOf(MimeMultipart.class);
        MimeMultipart contenuto = (MimeMultipart) inviato.getContent();
        assertThat(contenuto.getCount()).isEqualTo(2); // corpo testuale + allegato
        assertThat(contenuto.getBodyPart(1).getFileName()).isEqualTo("dati-motormindhub.json");
    }

    @Test
    void invia_nonPropagaEccezione_quandoLinvioSmtpFallisce() {
        doThrow(new MailSendException("SMTP non raggiungibile")).when(mailSender).send(any(SimpleMailMessage.class));

        assertThatCode(() -> gestioneNotifiche.onUserRegistered(
                new UtenteRegistratoEvent(1L, "marco@provider.it", "Marco", "tok-verifica")))
                .doesNotThrowAnyException();
    }

    @Test
    void onAccountCancellato_inviaComunqueLaCopiaInternaAlGestore_quandoLinvioAllUtenteFallisce() {
        doThrow(new MailSendException("SMTP non raggiungibile"))
                .doNothing()
                .when(mailSender).send(any(SimpleMailMessage.class));

        assertThatCode(() -> gestioneNotifiche.onAccountCancellato(new AccountCancellatoEvent(7L, "email-originale@provider.it")))
                .doesNotThrowAnyException();

        verify(mailSender, times(2)).send(any(SimpleMailMessage.class));
    }

    // --- helper privati -----------------------------------------------------

    private SimpleMailMessage catturaMessaggioSemplice() {
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        return captor.getValue();
    }

    private static MimeMessage nuovoMimeMessageReale() {
        return new JavaMailSenderImpl().createMimeMessage();
    }
}
