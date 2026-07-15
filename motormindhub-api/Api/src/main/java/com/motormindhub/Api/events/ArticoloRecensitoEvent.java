package com.motormindhub.Api.events;

/**
 * Pubblicato da GestioneAutori.approveArticle/rejectArticle (ODD 2.4). Consumato da
 * GestioneNotifiche.onArticleReviewed (SDD 4.6) per notificare l'autore dell'esito, con eventuale
 * motivazione in caso di rifiuto - listener non ancora implementato.
 */
public record ArticoloRecensitoEvent(Long articoloId, Long autoreId, String autoreEmail,
                                      boolean approvato, String motivazione) {
}
