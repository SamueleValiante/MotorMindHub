package com.motormindhub.Api.model.entity;

/**
 * Statechart Articolo (RAD 3.4.5.2). Transizioni coperte da GestioneArticoli (ODD 2.2):
 * BOZZA -> IN_ATTESA_APPROVAZIONE (publishArticle); RIFIUTATO -> BOZZA (reopenRejectedArticle,
 * correzione post-rifiuto). Transizioni coperte da GestioneAutori (ODD 2.4):
 * IN_ATTESA_APPROVAZIONE -> PUBBLICATO (approveArticle) o RIFIUTATO (rejectArticle). Eliminazione
 * (non una transizione di stato) e' possibile da BOZZA (deleteDraft) o da qualsiasi altro stato
 * (deleteArticle) - vedi GestioneArticoli per i dettagli su chi puo' invocare cosa.
 */
public enum StatoArticolo {
    BOZZA,
    IN_ATTESA_APPROVAZIONE,
    PUBBLICATO,
    RIFIUTATO
}
