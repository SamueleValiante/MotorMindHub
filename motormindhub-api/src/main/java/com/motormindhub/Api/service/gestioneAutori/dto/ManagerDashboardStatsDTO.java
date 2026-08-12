package com.motormindhub.Api.service.gestioneAutori.dto;

import java.util.List;

/**
 * RF3.1 - mockup 29_manager_dashboard.png. Il grafico "Andamento visite" non e' incluso qui: il
 * tracciamento ora esiste (VisitaSessione, GestioneAmministrazioneUtenti.getVisiteStatistiche, RF3.1/
 * UC_28) ma e' esposto solo sulla dashboard del Gestore Utenti, non su questa - scelta di scope,
 * non piu' una lacuna dell'Object Model come in precedenza.
 */
public record ManagerDashboardStatsDTO(
        long articoliPubblicati,
        long inAttesaApprovazione,
        long autoriAttivi,
        long categorieTotali,
        List<PendingArticleDTO> articoliInCoda
) {
}
