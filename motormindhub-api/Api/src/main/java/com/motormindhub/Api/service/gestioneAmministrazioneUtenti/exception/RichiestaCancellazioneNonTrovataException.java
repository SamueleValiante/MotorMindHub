package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception;

/** Usata anche quando la richiesta esiste ma non e' IN_CODA (gia' elaborata o respinta). */
public class RichiestaCancellazioneNonTrovataException extends RuntimeException {

    public RichiestaCancellazioneNonTrovataException(String message) {
        super(message);
    }
}
