package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneUtenti.requestPasswordReset (ODD 2.1). Consumato da
 * GestioneNotifiche.onPasswordResetRequested (SDD 4.6) per l'invio del link di recupero.
 */
public record PasswordResetRequestedEvent(Long utenteId, String email, String token) {
}
