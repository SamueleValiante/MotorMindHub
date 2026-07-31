package com.motormindhub.Api.service.storage.exception;

/** Il provider di Cloud Storage non e' raggiungibile o ha rifiutato la richiesta di upload. */
public class CloudStorageNonDisponibileException extends RuntimeException {

    public CloudStorageNonDisponibileException(String message, Throwable cause) {
        super(message, cause);
    }
}
