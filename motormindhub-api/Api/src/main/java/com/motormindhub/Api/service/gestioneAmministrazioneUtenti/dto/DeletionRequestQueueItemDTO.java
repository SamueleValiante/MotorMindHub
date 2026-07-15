package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import com.motormindhub.Api.model.entity.StatoRichiestaCancellazione;

import java.time.Instant;

/** RF4.6, UC_25 - mockup 46_gestore_coda_cancellazioni.png. */
public record DeletionRequestQueueItemDTO(
        Long id,
        Long utenteId,
        String utenteNome,
        String utenteEmail,
        StatoRichiestaCancellazione stato,
        Instant dataRichiesta
) {
}
