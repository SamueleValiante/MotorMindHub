package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneAmministrazioneUtenti.processAccountDeletion (ODD 2.5) al termine
 * dell'elaborazione della cancellazione. Consumato da GestioneNotifiche per inviare la conferma sia
 * all'utente sia, in copia interna, al Gestore Utenti (RF4.6, UC_25 passo 5) - listener non ancora
 * implementato.
 *
 * Nota: non compare tra i metodi elencati in ODD 2.6 (GestioneNotifiche), a differenza degli altri
 * eventi di questo sottosistema: e' comunque necessario per soddisfare UC_25 passo 5 alla lettera
 * ("invia un'email di conferma sia all'utente sia, in copia interna, al Gestore Utenti"), quindi
 * viene pubblicato seguendo lo stesso pattern - stessa natura delle altre lacune di documentazione
 * gia' incontrate (es. mockup duplicati).
 */
public record AccountCancellatoEvent(Long utenteId, String emailUtente) {
}
