package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import com.motormindhub.Api.model.entity.TipoAzioneAmministrativa;

import java.time.Instant;

/** RF4.8 - mockup 48_gestore_cronologia.png. */
public record AdministrativeActionLogEntryDTO(
        Instant dataAzione,
        TipoAzioneAmministrativa tipoAzione,
        Long utenteTargetId,
        String utenteTargetNome,
        String dettaglio
) {
}
