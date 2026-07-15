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
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * Facade del sottosistema GestioneNotifiche (SDD 3.5, ODD 2.6): reagisce esclusivamente agli eventi
 * di dominio pubblicati dagli altri sottosistemi, senza stato persistente proprio (cfr. invariante
 * ODD 2.6). Ogni listener e' @Async (AsyncConfig): l'invio dell'email non deve bloccare ne'
 * condividere la transazione del sottosistema che ha pubblicato l'evento - a differenza di
 * CategoriaEliminataListener (GestioneArticoli), che resta sincrono per un motivo opposto (integrita'
 * referenziale nella stessa transazione, vedi la sua javadoc).
 *
 * Non e' presente un listener per CategoriaEliminataEvent: e' gia' consumato sincronamente da
 * CategoriaEliminataListener (GestioneArticoli) per riassegnare gli articoli orfani, non e' un evento
 * di notifica via email.
 */
@Service
public class GestioneNotifiche {

    private static final int GIORNI_SCADENZA_LINK_SENSIBILI = 1; // RNF9.3: "es. 24 ore"

    private final JavaMailSender mailSender;
    private final String mittente;
    private final String frontendBaseUrl;
    private final String notificheInterneGestoreUtenti;

    public GestioneNotifiche(JavaMailSender mailSender,
                              @Value("${app.mail.from}") String mittente,
                              @Value("${app.frontend-base-url}") String frontendBaseUrl,
                              @Value("${app.mail.notifiche-interne-gestore-utenti}") String notificheInterneGestoreUtenti) {
        this.mailSender = mailSender;
        this.mittente = mittente;
        this.frontendBaseUrl = frontendBaseUrl;
        this.notificheInterneGestoreUtenti = notificheInterneGestoreUtenti;
    }

    /**
     * pre: evento UtenteRegistratoEvent pubblicato
     * post: email di verifica inviata all'indirizzo evt.email
     * (ODD 2.6, RF1.3, UC_1, RNF9.1)
     */
    @Async
    @EventListener
    public void onUserRegistered(UtenteRegistratoEvent evento) {
        String link = frontendBaseUrl + "/conferma-email?token=" + evento.tokenVerifica();
        invia(evento.email(), "Conferma il tuo indirizzo email", """
                Ciao %s,

                Grazie per esserti registrato su MotorMindHub. Conferma il tuo indirizzo email cliccando sul link seguente:
                %s

                Il link e' valido una sola volta e scade tra %d giorno/i (RNF9.3). Se non hai richiesto tu questa registrazione, ignora questa email.
                """.formatted(evento.nome(), link, GIORNI_SCADENZA_LINK_SENSIBILI));
    }

    /**
     * pre: evento PasswordResetRequestedEvent pubblicato
     * post: email con link di recupero inviata
     * (ODD 2.6, RF1.5, UC_3)
     */
    @Async
    @EventListener
    public void onPasswordResetRequested(PasswordResetRequestedEvent evento) {
        String link = frontendBaseUrl + "/recupero-password/reimposta?token=" + evento.token();
        invia(evento.email(), "Recupero password", """
                Hai richiesto il recupero della password del tuo account MotorMindHub. Clicca sul link seguente per impostarne una nuova:
                %s

                Il link e' valido una sola volta e scade tra %d giorno/i (RNF9.3). Se non hai richiesto tu il recupero, ignora questa email.
                """.formatted(link, GIORNI_SCADENZA_LINK_SENSIBILI));
    }

    /**
     * pre: evento AutoreInvitatoEvent pubblicato
     * post: email di invito inviata all'indirizzo evt.email
     * (ODD 2.6, RF3.3, UC_9)
     */
    @Async
    @EventListener
    public void onAuthorInvited(AutoreInvitatoEvent evento) {
        String link = frontendBaseUrl + "/inviti/" + evento.token() + "/accetta";
        invia(evento.email(), "Invito a entrare nel team editoriale di MotorMindHub", """
                Ciao %s,

                Il Manager degli Autori di MotorMindHub ti ha invitato a entrare nel team editoriale. Accetta o rifiuta l'invito dal link seguente:
                %s

                Il link e' valido una sola volta e scade tra %d giorno/i (RNF9.3).
                """.formatted(evento.nome(), link, GIORNI_SCADENZA_LINK_SENSIBILI));
    }

    /**
     * pre: evento ArticoloRecensitoEvent pubblicato
     * post: email di esito inviata all'autore dell'articolo
     * (ODD 2.6, RF3.6, UC_21)
     */
    @Async
    @EventListener
    public void onArticleReviewed(ArticoloRecensitoEvent evento) {
        if (evento.approvato()) {
            invia(evento.autoreEmail(), "Il tuo articolo e' stato approvato",
                    "Buone notizie! Il tuo articolo e' stato approvato dal Manager degli Autori ed e' ora pubblicato su MotorMindHub.");
        } else {
            invia(evento.autoreEmail(), "Il tuo articolo e' stato rifiutato", """
                    Il tuo articolo non e' stato approvato dal Manager degli Autori.

                    Motivazione: %s
                    """.formatted(evento.motivazione()));
        }
    }

    /**
     * pre: evento AccountSospesoEvent pubblicato
     * post: email di sospensione inviata
     * (ODD 2.6, RF4.3, UC_23)
     */
    @Async
    @EventListener
    public void onAccountSuspended(AccountSospesoEvent evento) {
        String durata = evento.durataGiorni() == null
                ? "a tempo indeterminato"
                : "per %d giorni".formatted(evento.durataGiorni());
        invia(evento.email(), "Il tuo account e' stato sospeso", """
                Il tuo account MotorMindHub e' stato sospeso %s.

                Motivazione: %s

                Se ritieni la sospensione ingiustificata, puoi presentare ricorso rispondendo a questa email o contattando il supporto.
                """.formatted(durata, evento.motivazione()));
    }

    /**
     * pre: evento AccountRiattivatoEvent pubblicato
     * post: email di riattivazione inviata
     * (ODD 2.6, UC_24)
     */
    @Async
    @EventListener
    public void onAccountReactivated(AccountRiattivatoEvent evento) {
        invia(evento.email(), "Il tuo account e' stato riattivato",
                "Il tuo account MotorMindHub e' stato riattivato: puoi tornare ad accedere normalmente.");
    }

    /**
     * pre: evento RichiestaModificaProfiloEvent pubblicato
     * post: email di richiesta modifica inviata
     * (ODD 2.6, RF4.5, UC_26)
     */
    @Async
    @EventListener
    public void onReportResolutionRequested(RichiestaModificaProfiloEvent evento) {
        invia(evento.email(), "Richiesta di modifica del profilo", """
                Il tuo profilo su MotorMindHub e' stato segnalato per una possibile violazione dei Termini di Servizio.

                Ti chiediamo di correggere il profilo entro %d giorni: in caso contrario l'account potra' essere sospeso.
                """.formatted(evento.giorniPerLaModifica()));
    }

    /**
     * pre: evento DataExportReadyEvent pubblicato
     * post: email con link di download (one-time, RNF9.3) inviata
     * (ODD 2.6, RF1.10, RF4.7)
     *
     * Deviazione documentata da RNF9.3 ("link di download sicuro e a scadenza"): l'evento, cosi'
     * come pubblicato da GestioneUtenti.requestAccountDataExport e
     * GestioneAmministrazioneUtenti.exportUserDataAssisted (ODD 2.1/2.5), trasporta gia' il
     * contenuto esportato come stringa JSON, non un token da risolvere in un link temporaneo - non
     * esiste nell'Object Model (RAD 3.4.4) un'entita' per un download token con scadenza. Il file
     * viene quindi allegato direttamente all'email invece che linkato: soddisfa comunque "l'utente
     * riceve il link di download" (UC_27) nella sostanza (i dati arrivano via email allo stesso
     * indirizzo verificato), ma non l'aspetto "one-time/a scadenza" della RNF, che richiederebbe
     * un'infrastruttura di storage temporaneo fuori dallo scope di questo sottosistema.
     */
    @Async
    @EventListener
    public void onDataExportReady(DataExportReadyEvent evento) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mittente);
            helper.setTo(evento.email());
            helper.setSubject("I tuoi dati personali sono pronti");
            helper.setText("In allegato trovi l'esportazione dei tuoi dati personali richiesta su MotorMindHub, in formato JSON (RNF5.6).");
            helper.addAttachment("dati-motormindhub.json",
                    new ByteArrayResource(evento.datiEsportati().getBytes(StandardCharsets.UTF_8)));
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new IllegalStateException("Impossibile costruire l'email di esportazione dati.", e);
        }
    }

    /**
     * pre: evento BruteForceLockoutEvent pubblicato
     * post: email di conferma sblocco inviata
     * (ODD 2.6, RNF2.6)
     */
    @Async
    @EventListener
    public void onBruteForceLockout(BruteForceLockoutEvent evento) {
        String link = frontendBaseUrl + "/sblocco-account?token=" + evento.tokenSblocco();
        invia(evento.email(), "Account temporaneamente bloccato", """
                Il tuo account MotorMindHub e' stato temporaneamente bloccato a causa di troppi tentativi di accesso falliti.

                Se sei stato tu, conferma di voler sbloccare subito l'account cliccando sul link seguente (in alternativa il blocco si rimuove automaticamente dopo un breve periodo):
                %s

                Se non sei stato tu, ti consigliamo di cambiare la password non appena possibile.
                """.formatted(link));
    }

    /**
     * post: email di conferma cancellazione inviata sia all'utente sia, in copia interna, al Gestore
     * Utenti (RF4.6, UC_25 passo 5: "invia un'email di conferma sia all'utente sia, in copia interna,
     * al Gestore Utenti").
     *
     * Non compare tra i metodi elencati in ODD 2.6, a differenza degli altri listener di questo
     * sottosistema (gap gia' documentato nella javadoc di AccountCancellatoEvent): implementato
     * comunque perche' richiesto alla lettera da UC_25.
     *
     * evt.emailUtente() e' l'indirizzo originale dell'utente, catturato da
     * GestioneAmministrazioneUtenti.processAccountDeletion PRIMA della chiamata a Utente.anonimizza()
     * (ODD 2.5): a questo punto l'entita' Utente e' gia' stata anonimizzata, quindi l'evento e' l'unica
     * fonte possibile per l'indirizzo a cui inviare la conferma - leggerlo di nuovo dall'entita'
     * restituirebbe il placeholder generato da anonimizza(), non l'email reale del destinatario.
     * Non esiste un indirizzo per-operatore (nessun sottosistema traccia "chi" ha processato la
     * richiesta, cfr. LogAzioneAmministrativa): la copia interna va quindi a una casella dedicata al
     * ruolo Gestore Utenti (app.mail.notifiche-interne-gestore-utenti), non a una persona specifica.
     */
    @Async
    @EventListener
    public void onAccountCancellato(AccountCancellatoEvent evento) {
        invia(evento.emailUtente(), "Conferma cancellazione account", """
                La cancellazione del tuo account MotorMindHub e' stata completata: i tuoi dati personali sono stati eliminati o anonimizzati in modo irreversibile, come richiesto (RNF5.5).

                Se non sei stato tu a richiederla, contatta immediatamente il supporto.
                """);
        invia(notificheInterneGestoreUtenti, "Cancellazione account elaborata (utente #%d)".formatted(evento.utenteId()), """
                La richiesta di cancellazione dell'account con id %d (indirizzo originale: %s) e' stata elaborata con successo.
                """.formatted(evento.utenteId(), evento.emailUtente()));
    }

    // --- helper privati -----------------------------------------------------

    private void invia(String destinatario, String oggetto, String corpo) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mittente);
        message.setTo(destinatario);
        message.setSubject(oggetto);
        message.setText(corpo);
        mailSender.send(message);
    }
}
