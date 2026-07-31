package com.motormindhub.Api.service.storage.exception;

/**
 * Il file caricato non supera la validazione di ImageUploadValidator: dimensione oltre soglia,
 * formato non in whitelist, o contenuto che non decodifica come una vera immagine (nome file/
 * Content-Type spoofabili dal client, cfr. ImageUploadValidator). errorCode distingue i tre casi
 * per il client (stesso pattern di BadCredentialsException/DisabledException/LockedException in
 * GlobalExceptionHandler), senza tre classi di eccezione separate per un'unica causa applicativa
 * ("il file non va bene").
 */
public class ImmagineNonValidaException extends RuntimeException {

    private final String errorCode;

    public ImmagineNonValidaException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
