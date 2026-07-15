package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import com.motormindhub.Api.model.entity.StatoSegnalazione;

import java.time.Instant;

/** RF4.5, UC_26 - mockup 44_gestore_coda_segnalazioni.png, 45_gestore_dettaglio_segnalazione.png. */
public record ReportQueueItemDTO(
        Long id,
        Long segnalatoId,
        String segnalatoNome,
        String segnalatoEmail,
        String motivazione,
        StatoSegnalazione stato,
        Instant dataCreazione
) {
}
