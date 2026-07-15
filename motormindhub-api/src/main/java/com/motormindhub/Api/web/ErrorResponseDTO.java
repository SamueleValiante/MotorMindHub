package com.motormindhub.Api.web;

import java.time.Instant;
import java.util.List;

public record ErrorResponseDTO(
        Instant timestamp,
        int status,
        String error,
        List<String> messages
) {

    public static ErrorResponseDTO of(int status, String error, String message) {
        return new ErrorResponseDTO(Instant.now(), status, error, List.of(message));
    }

    public static ErrorResponseDTO of(int status, String error, List<String> messages) {
        return new ErrorResponseDTO(Instant.now(), status, error, messages);
    }
}
