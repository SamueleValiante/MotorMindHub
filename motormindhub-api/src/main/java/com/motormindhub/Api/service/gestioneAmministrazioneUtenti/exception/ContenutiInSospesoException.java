package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception;

/** UC_25.1: l'utente ha articoli IN_ATTESA_APPROVAZIONE, la cancellazione deve attendere la loro risoluzione. */
public class ContenutiInSospesoException extends RuntimeException {

    public ContenutiInSospesoException(String message) {
        super(message);
    }
}
