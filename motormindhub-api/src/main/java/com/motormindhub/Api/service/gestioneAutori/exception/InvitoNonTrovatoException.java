package com.motormindhub.Api.service.gestioneAutori.exception;

/** Usata anche quando il token e' valido ma l'invito e' scaduto o gia' processato. */
public class InvitoNonTrovatoException extends RuntimeException {

    public InvitoNonTrovatoException(String message) {
        super(message);
    }
}
