package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneAmministrazioneUtenti.suspendAccount (ODD 2.5). Consumato da
 * GestioneNotifiche.onAccountSuspended (ODD 2.6) per notificare l'utente di motivazione e modalita'
 * di ricorso (RF4.3, UC_23) - listener non ancora implementato.
 */
public record AccountSospesoEvent(Long utenteId, String email, String motivazione, Integer durataGiorni) {
}
