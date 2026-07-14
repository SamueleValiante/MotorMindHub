package com.motormindhub.Api.service.gestioneUtenti.exception;

/**
 * Violazione di una regola di dominio non riconducibile a "non trovato" o "conflitto" (es. consenso
 * privacy mancante, auto-segnalazione). Corrisponde a un 400 Bad Request.
 */
public class RegolaDiDominioViolataException extends RuntimeException {

    public RegolaDiDominioViolataException(String message) {
        super(message);
    }
}
