package com.motormindhub.Api.service.gestioneArticoli.dto;

/**
 * Risposta di createDraft: a differenza degli altri endpoint di scrittura di
 * GestioneArticoli, qui il chiamante non conosce già l'id dell'articolo
 * (updateDraft/publishArticle/... agiscono su un id di percorso esistente) e
 * ne ha bisogno per proseguire l'editing (updateDraft, publishArticle) senza
 * dover rileggere getArticlesByAuthor per individuarlo.
 */
public record DraftCreatedResponseDTO(Long id, String message) {
}
