package com.motormindhub.Api.model.entity;

/**
 * Statechart Articolo (RAD 3.4.5.2). Transizioni coperte da GestioneArticoli (ODD 2.2):
 * BOZZA -> IN_ATTESA_APPROVAZIONE (publishArticle). Transizioni coperte da GestioneAutori (ODD 2.4,
 * non ancora implementato): IN_ATTESA_APPROVAZIONE -> PUBBLICATO (approveArticle) o RIFIUTATO
 * (rejectArticle).
 */
public enum StatoArticolo {
    BOZZA,
    IN_ATTESA_APPROVAZIONE,
    PUBBLICATO,
    RIFIUTATO
}
