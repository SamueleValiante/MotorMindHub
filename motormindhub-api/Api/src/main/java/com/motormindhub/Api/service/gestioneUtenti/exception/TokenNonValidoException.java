package com.motormindhub.Api.service.gestioneUtenti.exception;

/** Usata sia per il token di verifica email sia per il token di recupero password (invalido, scaduto o gia' usato). */
public class TokenNonValidoException extends RuntimeException {

    public TokenNonValidoException(String message) {
        super(message);
    }
}
