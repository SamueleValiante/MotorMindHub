package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import com.motormindhub.Api.model.entity.TipoAzioneAmministrativa;

/** RF4.8 - mockup 48_gestore_cronologia.png (tab di categoria + barra di ricerca libera). */
public record AdministrativeActionLogFiltersDTO(
        TipoAzioneAmministrativa tipoAzione,
        String query
) {
}
