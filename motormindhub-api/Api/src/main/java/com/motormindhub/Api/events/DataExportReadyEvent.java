package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneUtenti.requestAccountDataExport (ODD 2.1) e da
 * GestioneAmministrazioneUtenti.exportUserDataAssisted (SDD 4.5). Consumato da
 * GestioneNotifiche.onDataExportReady (SDD 4.6) per l'invio del link di download one-time (RNF9.3).
 */
public record DataExportReadyEvent(Long utenteId, String email, String datiEsportati) {
}
