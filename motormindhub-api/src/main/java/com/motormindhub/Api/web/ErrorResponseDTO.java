package com.motormindhub.Api.web;

import java.time.Instant;
import java.util.List;

public record ErrorResponseDTO(
        Instant timestamp,
        int status,
        String error,
        List<String> messages,
        // Nullable: valorizzato solo dove serve distinguere programmaticamente piu' cause dietro
        // lo stesso status HTTP (es. 401 di login: credenziali errate / account non verificato /
        // account bloccato-sospeso, cfr. RAD UC_2.1-2.3), non un requisito generale per ogni errore.
        String errorCode
) {

    public static ErrorResponseDTO of(int status, String error, String message) {
        return new ErrorResponseDTO(Instant.now(), status, error, List.of(message), null);
    }

    public static ErrorResponseDTO of(int status, String error, List<String> messages) {
        return new ErrorResponseDTO(Instant.now(), status, error, messages, null);
    }

    public static ErrorResponseDTO of(int status, String error, String message, String errorCode) {
        return new ErrorResponseDTO(Instant.now(), status, error, List.of(message), errorCode);
    }
}
