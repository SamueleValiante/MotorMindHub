package com.motormindhub.Api.service.gestioneAutori.dto;

import com.motormindhub.Api.model.entity.StatoUtente;

/** RF3.2, UC_8 - mockup 30_manager_autori.png. */
public record AuthorSummaryDTO(
        Long id,
        String nome,
        String cognome,
        String email,
        long numeroArticoli,
        StatoUtente stato
) {
}
