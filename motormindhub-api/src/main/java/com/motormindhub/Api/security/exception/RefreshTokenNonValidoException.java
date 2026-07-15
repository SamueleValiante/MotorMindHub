package com.motormindhub.Api.security.exception;

/** Refresh token inesistente, scaduto, gia' revocato (rotation/logout), o account non piu' attivo. */
public class RefreshTokenNonValidoException extends RuntimeException {

    public RefreshTokenNonValidoException(String message) {
        super(message);
    }
}
