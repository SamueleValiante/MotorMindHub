package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneUtenti.registerUser (ODD 2.1). Consumato da GestioneNotifiche.onUserRegistered
 * (SDD 4.6) per l'invio dell'email di verifica - listener non ancora implementato in questo sottosistema.
 */
public record UtenteRegistratoEvent(Long utenteId, String email, String nome, String tokenVerifica) {
}
