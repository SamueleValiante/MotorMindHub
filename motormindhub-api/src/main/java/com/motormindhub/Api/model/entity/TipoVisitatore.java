package com.motormindhub.Api.model.entity;

/**
 * Tipo del chiamante al momento della registrazione di una visita (VisitaSessione): solo Guest e
 * Iscritto sono tracciati, stesso filtro di ruolo gia' applicato agli incrementi di
 * numeroVisualizzazioni in GestioneArticoli.getArticleById - i ruoli redazionali non contano mai.
 */
public enum TipoVisitatore {
    GUEST,
    ISCRITTO
}
