package com.motormindhub.Api.service.gestioneNotifiche.specific;

/**
 * Astrazione dal meccanismo concreto di invio email (pattern Strategy, stesso principio di
 * CloudStorageService in /service/storage): a differenza di quest'ultimo, pero', l'invio email e'
 * usato solo da GestioneNotifiche, nessun altro sottosistema - vive quindi correttamente sotto il
 * suo /specific, non in un pacchetto condiviso.
 *
 * Introdotta dopo aver scoperto che Railway blocca le connessioni SMTP in uscita sui piani
 * non-Pro (MailConnectException/SocketTimeoutException verso smtp.postmarkapp.com:587, causa nota
 * e documentata dalla piattaforma stessa): SmtpEmailSender (via JavaMailSender) resta l'
 * implementazione per lo sviluppo locale con Mailpit, PostmarkApiEmailSender (via HTTP, porta 443,
 * mai bloccata) la sostituisce in produzione.
 *
 * Contratto implicito per ogni implementazione: send() non propaga mai un'eccezione al chiamante -
 * un fallimento (timeout, provider non raggiungibile, credenziali non valide) viene catturato e
 * loggato internamente. GestioneNotifiche fa affidamento su questa garanzia (es. onAccountCancellato
 * invia a due destinatari indipendenti in sequenza: il fallimento del primo non deve impedire il
 * secondo) e non duplica un try/catch a sua volta.
 */
public interface EmailSender {

    void send(String destinatario, String oggetto, String corpo);

    void send(String destinatario, String oggetto, String corpo, String allegatoNome, byte[] allegatoContenuto);
}
