package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception;

/** Usata anche quando la segnalazione esiste ma non e' in uno stato lavorabile (ARCHIVIATA). */
public class SegnalazioneNonTrovataException extends RuntimeException {

    public SegnalazioneNonTrovataException(String message) {
        super(message);
    }
}
