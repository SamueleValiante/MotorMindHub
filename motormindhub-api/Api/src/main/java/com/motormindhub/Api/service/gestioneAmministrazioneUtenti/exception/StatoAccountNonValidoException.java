package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception;

/** L'account non si trova nello stato richiesto dalla pre-condizione (es. ATTIVO per sospendere, SOSPESO per riattivare). */
public class StatoAccountNonValidoException extends RuntimeException {

    public StatoAccountNonValidoException(String message) {
        super(message);
    }
}
