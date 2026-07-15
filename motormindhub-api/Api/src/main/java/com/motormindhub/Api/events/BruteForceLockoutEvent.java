package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneUtenti.registerFailedLoginAttempt (RNF2.6, UC_2.2 - non un contratto OCL
 * formale di ODD 2.1, che non modella *authenticate). Consumato da
 * GestioneNotifiche.onBruteForceLockout (ODD 2.6) per inviare l'email di conferma sblocco - listener
 * non ancora implementato.
 */
public record BruteForceLockoutEvent(Long utenteId, String email, String tokenSblocco) {
}
