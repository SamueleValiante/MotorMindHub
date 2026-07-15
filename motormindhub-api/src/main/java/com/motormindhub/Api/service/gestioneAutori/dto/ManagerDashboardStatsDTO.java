package com.motormindhub.Api.service.gestioneAutori.dto;

import java.util.List;

/**
 * RF3.1 - mockup 29_manager_dashboard.png. Il grafico "Andamento visite" non e' incluso: richiede
 * un tracciamento delle visualizzazioni per data che non fa parte dell'Object Model (RAD 3.4.4) e
 * andrebbe oltre lo scope dei contratti OCL di GestioneAutori (ODD 2.4).
 */
public record ManagerDashboardStatsDTO(
        long articoliPubblicati,
        long inAttesaApprovazione,
        long autoriAttivi,
        long categorieTotali,
        List<PendingArticleDTO> articoliInCoda
) {
}
