package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneAmministrazioneUtenti.reactivateAccount (ODD 2.5). Consumato da
 * GestioneNotifiche.onAccountReactivated (ODD 2.6) per notificare l'utente della riattivazione
 * (RF4.4, UC_24) - listener non ancora implementato.
 */
public record AccountRiattivatoEvent(Long utenteId, String email) {
}
