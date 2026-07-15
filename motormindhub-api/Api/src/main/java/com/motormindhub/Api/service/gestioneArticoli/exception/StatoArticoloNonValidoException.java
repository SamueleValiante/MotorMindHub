package com.motormindhub.Api.service.gestioneArticoli.exception;

/** L'articolo esiste ma non e' nello stato richiesto dalla pre-condizione OCL del metodo invocato. */
public class StatoArticoloNonValidoException extends RuntimeException {

    public StatoArticoloNonValidoException(String message) {
        super(message);
    }
}
