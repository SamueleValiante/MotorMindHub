package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneAutori.inviteAuthor (ODD 2.4). Consumato da GestioneNotifiche.onAuthorInvited
 * (SDD 4.6) per l'invio dell'email di invito - listener non ancora implementato.
 */
public record AutoreInvitatoEvent(Long invitoId, String nome, String email, String token) {
}
