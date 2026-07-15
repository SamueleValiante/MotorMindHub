package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneAmministrazioneUtenti.resolveReport quando l'esito e' "richiedi modifica"
 * (ODD 2.5). Consumato da GestioneNotifiche.onReportResolutionRequested (ODD 2.6) per chiedere
 * all'utente segnalato la modifica del profilo entro il termine indicato (RF4.5, UC_26) - listener
 * non ancora implementato.
 */
public record RichiestaModificaProfiloEvent(Long utenteId, String email, int giorniPerLaModifica) {
}
