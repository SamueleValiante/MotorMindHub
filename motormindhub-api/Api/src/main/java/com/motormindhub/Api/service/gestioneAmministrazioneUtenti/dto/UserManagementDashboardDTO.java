package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

/** RF4.1, UC_22 - mockup 38_gestore_dashboard.png. */
public record UserManagementDashboardDTO(
        long utentiRegistrati,
        long segnalazioniAperte,
        long richiesteCancellazioneInCoda
) {
}
