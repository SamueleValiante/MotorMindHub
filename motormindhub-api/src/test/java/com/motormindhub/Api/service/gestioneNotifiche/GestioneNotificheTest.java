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
import com.motormindhub.Api.service.gestioneNotifiche.specific.EmailSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * Un test per ciascun listener di GestioneNotifiche (ODD 2.6): non esistono contratti OCL formali
 * (il sottosistema non ha stato persistente proprio), quindi ogni test verifica solo che, ricevuto
 * l'evento, venga chiamato EmailSender.send con destinatario/oggetto/corpo attesi - non la
 * consegna reale ne' il meccanismo di trasporto (SMTP vs API HTTP), quello e' testato
 * separatamente in SmtpEmailSenderTest/PostmarkApiEmailSenderTest.
 */
@ExtendWith(MockitoExtension.class)
class GestioneNotificheTest {

    private static final String FRONTEND_BASE_URL = "http://localhost:3000";
    private static final String NOTIFICHE_INTERNE = "gestore-utenti@motormindhub.it";

    @Mock
    private EmailSender emailSender;

    private GestioneNotifiche gestioneNotifiche;

    @BeforeEach
    void setUp() {
        gestioneNotifiche = new GestioneNotifiche(emailSender, FRONTEND_BASE_URL, NOTIFICHE_INTERNE);
    }

    @Test
    void onUserRegistered_inviaEmailDiVerificaConLinkToken() {
        gestioneNotifiche.onUserRegistered(new UtenteRegistratoEvent(1L, "marco@provider.it", "Marco", "tok-verifica"));

        EmailCatturata email = catturaEmailSemplice();
        assertThat(email.destinatario()).isEqualTo("marco@provider.it");
        assertThat(email.oggetto()).containsIgnoringCase("conferma");
        assertThat(email.corpo()).contains(FRONTEND_BASE_URL + "/conferma-email?token=tok-verifica");
    }

    @Test
    void onPasswordResetRequested_inviaEmailConLinkDiRecupero() {
        gestioneNotifiche.onPasswordResetRequested(new PasswordResetRequestedEvent(1L, "marco@provider.it", "tok-reset"));

        EmailCatturata email = catturaEmailSemplice();
        assertThat(email.destinatario()).isEqualTo("marco@provider.it");
        assertThat(email.corpo()).contains(FRONTEND_BASE_URL + "/reimposta-password?token=tok-reset");
    }

    @Test
    void onAuthorInvited_inviaEmailDiInvitoConLinkToken() {
        gestioneNotifiche.onAuthorInvited(new AutoreInvitatoEvent(1L, "Giulia", "giulia@provider.it", "tok-invito"));

        EmailCatturata email = catturaEmailSemplice();
        assertThat(email.destinatario()).isEqualTo("giulia@provider.it");
        assertThat(email.corpo()).contains(FRONTEND_BASE_URL + "/inviti/tok-invito/accetta");
    }

    @Test
    void onArticleReviewed_inviaEmailDiApprovazione_quandoApprovato() {
        gestioneNotifiche.onArticleReviewed(new ArticoloRecensitoEvent(10L, 1L, "autore@provider.it", true, null));

        EmailCatturata email = catturaEmailSemplice();
        assertThat(email.destinatario()).isEqualTo("autore@provider.it");
        assertThat(email.oggetto()).containsIgnoringCase("approvato");
    }

    @Test
    void onArticleReviewed_inviaEmailDiRifiutoConMotivazione_quandoRifiutato() {
        gestioneNotifiche.onArticleReviewed(new ArticoloRecensitoEvent(10L, 1L, "autore@provider.it", false, "Fonti non verificabili"));

        EmailCatturata email = catturaEmailSemplice();
        assertThat(email.oggetto()).containsIgnoringCase("rifiutato");
        assertThat(email.corpo()).contains("Fonti non verificabili");
    }

    @Test
    void onAccountSuspended_inviaEmailConMotivazioneEDurata() {
        gestioneNotifiche.onAccountSuspended(new AccountSospesoEvent(1L, "paolo@provider.it", "Contenuti inappropriati", 30));

        EmailCatturata email = catturaEmailSemplice();
        assertThat(email.destinatario()).isEqualTo("paolo@provider.it");
        assertThat(email.corpo()).contains("Contenuti inappropriati").contains("30 giorni");
    }

    @Test
    void onAccountSuspended_indicaSospensionePermanente_quandoDurataNulla() {
        gestioneNotifiche.onAccountSuspended(new AccountSospesoEvent(1L, "paolo@provider.it", "Violazione grave", null));

        EmailCatturata email = catturaEmailSemplice();
        assertThat(email.corpo()).containsIgnoringCase("tempo indeterminato");
    }

    @Test
    void onAccountReactivated_inviaEmailDiRiattivazione() {
        gestioneNotifiche.onAccountReactivated(new AccountRiattivatoEvent(1L, "paolo@provider.it"));

        EmailCatturata email = catturaEmailSemplice();
        assertThat(email.destinatario()).isEqualTo("paolo@provider.it");
        assertThat(email.oggetto()).containsIgnoringCase("riattivato");
    }

    @Test
    void onReportResolutionRequested_inviaEmailConGiorniPerLaModifica() {
        gestioneNotifiche.onReportResolutionRequested(new RichiestaModificaProfiloEvent(2L, "xracer@provider.it", 7));

        EmailCatturata email = catturaEmailSemplice();
        assertThat(email.destinatario()).isEqualTo("xracer@provider.it");
        assertThat(email.corpo()).contains("7 giorni");
    }

    @Test
    void onBruteForceLockout_inviaEmailConLinkDiSblocco() {
        gestioneNotifiche.onBruteForceLockout(new BruteForceLockoutEvent(1L, "marco@provider.it", "tok-sblocco"));

        EmailCatturata email = catturaEmailSemplice();
        assertThat(email.destinatario()).isEqualTo("marco@provider.it");
        assertThat(email.corpo()).contains(FRONTEND_BASE_URL + "/sblocco-account?token=tok-sblocco");
    }

    @Test
    void onAccountCancellato_inviaConfermaAllUtenteECopiaInternaAlGestore() {
        gestioneNotifiche.onAccountCancellato(new AccountCancellatoEvent(7L, "email-originale@provider.it"));

        ArgumentCaptor<String> destinatari = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> oggetti = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> corpi = ArgumentCaptor.forClass(String.class);
        verify(emailSender, times(2)).send(destinatari.capture(), oggetti.capture(), corpi.capture());

        assertThat(destinatari.getAllValues()).containsExactlyInAnyOrder("email-originale@provider.it", NOTIFICHE_INTERNE);
        assertThat(oggetti.getAllValues()).anySatisfy(o -> assertThat(o).containsIgnoringCase("conferma"));
        assertThat(corpi.getAllValues()).anySatisfy(c -> assertThat(c).contains("email-originale@provider.it").contains("7"));
    }

    @Test
    void onDataExportReady_inviaEmailConDatiEsportatiInAllegato() {
        String datiEsportati = "{\"nome\":\"Marco\",\"email\":\"marco@provider.it\"}";
        gestioneNotifiche.onDataExportReady(new DataExportReadyEvent(1L, "marco@provider.it", datiEsportati));

        ArgumentCaptor<String> destinatario = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> oggetto = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> corpo = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> allegatoNome = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<byte[]> allegatoContenuto = ArgumentCaptor.forClass(byte[].class);
        verify(emailSender).send(destinatario.capture(), oggetto.capture(), corpo.capture(),
                allegatoNome.capture(), allegatoContenuto.capture());

        assertThat(destinatario.getValue()).isEqualTo("marco@provider.it");
        assertThat(oggetto.getValue()).containsIgnoringCase("dati");
        assertThat(allegatoNome.getValue()).isEqualTo("dati-motormindhub.json");
        assertThat(new String(allegatoContenuto.getValue(), StandardCharsets.UTF_8)).isEqualTo(datiEsportati);
    }

    // --- helper privati -----------------------------------------------------

    private record EmailCatturata(String destinatario, String oggetto, String corpo) {
    }

    private EmailCatturata catturaEmailSemplice() {
        ArgumentCaptor<String> destinatario = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> oggetto = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> corpo = ArgumentCaptor.forClass(String.class);
        verify(emailSender).send(destinatario.capture(), oggetto.capture(), corpo.capture());
        return new EmailCatturata(destinatario.getValue(), oggetto.getValue(), corpo.getValue());
    }
}
