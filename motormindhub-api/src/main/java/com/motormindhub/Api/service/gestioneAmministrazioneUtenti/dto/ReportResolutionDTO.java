package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import com.motormindhub.Api.model.entity.StatoSegnalazione;
import jakarta.validation.constraints.NotNull;

/**
 * RF4.5, UC_26 - mockup 45_gestore_dettaglio_segnalazione.png. Il contratto OCL di resolveReport
 * (ODD 2.5) assegna direttamente "dto.nuovoStato" allo stato della segnalazione: nuovoStato = IN_GESTIONE
 * corrisponde a "Richiedi modifica" (UC_26 passo 5, invia RichiestaModificaProfiloEvent);
 * nuovoStato = ARCHIVIATA corrisponde sia a "Archivia come infondata" (UC_26.1) sia all'esito di
 * "Scala a sospensione" (UC_26.2) - in quest'ultimo caso il Gestore invoca separatamente
 * suspendAccount (la sospensione stessa e' UC_23, un caso d'uso distinto, come indicato dal RAD:
 * "puo' scalare direttamente la segnalazione a sospensione (UC_23)").
 */
public record ReportResolutionDTO(
        @NotNull
        StatoSegnalazione nuovoStato
) {
}
