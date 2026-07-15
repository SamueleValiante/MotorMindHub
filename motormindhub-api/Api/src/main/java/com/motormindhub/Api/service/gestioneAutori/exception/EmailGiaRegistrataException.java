package com.motormindhub.Api.service.gestioneAutori.exception;

/**
 * Guardia difensiva non richiesta esplicitamente dal contratto OCL di inviteAuthor (ODD 2.4), ma
 * necessaria per non violare l'invariante di unicita' email di GestioneUtenti quando acceptInvite
 * creera' il nuovo Utente.
 */
public class EmailGiaRegistrataException extends RuntimeException {

    public EmailGiaRegistrataException(String message) {
        super(message);
    }
}
