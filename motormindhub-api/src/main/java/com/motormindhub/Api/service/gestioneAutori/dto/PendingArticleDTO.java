package com.motormindhub.Api.service.gestioneAutori.dto;

/** RF3.1, UC_21 - mockup 36_manager_articoli_attesa.png. */
public record PendingArticleDTO(
        Long id,
        String titolo,
        String autoreNome,
        String categoriaNome,
        String dataInvio
) {
}
