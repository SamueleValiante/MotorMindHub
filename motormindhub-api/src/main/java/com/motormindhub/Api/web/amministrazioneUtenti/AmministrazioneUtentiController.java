package com.motormindhub.Api.web.amministrazioneUtenti;

import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoAzioneAmministrativa;
import com.motormindhub.Api.security.UserPrincipal;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.GestioneAmministrazioneUtenti;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.AdministrativeActionLogEntryDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.AdministrativeActionLogFiltersDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.DeletionRequestQueueItemDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.ReportQueueItemDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.ReportResolutionDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.SuspensionDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.UserManagementDashboardDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.UserSearchCriteriaDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.UserSummaryDTO;
import com.motormindhub.Api.web.MessageResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller di GestioneAmministrazioneUtenti (SDD 3, ODD 2.5). Interamente riservato al
 * Gestore Utenti (SDD 3.4, Tabella 1) - nessun endpoint pubblico, a differenza di AutoriController.
 */
@RestController
@RequestMapping("/api/v1/amministrazione-utenti")
public class AmministrazioneUtentiController {

    private final GestioneAmministrazioneUtenti gestioneAmministrazioneUtenti;

    public AmministrazioneUtentiController(GestioneAmministrazioneUtenti gestioneAmministrazioneUtenti) {
        this.gestioneAmministrazioneUtenti = gestioneAmministrazioneUtenti;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('GESTORE_UTENTI')")
    public ResponseEntity<UserManagementDashboardDTO> getUserManagementDashboard() {
        return ResponseEntity.ok(gestioneAmministrazioneUtenti.getUserManagementDashboard());
    }

    @GetMapping("/utenti")
    @PreAuthorize("hasRole('GESTORE_UTENTI')")
    public ResponseEntity<List<UserSummaryDTO>> searchUsers(@RequestParam(required = false) String query,
                                                              @RequestParam(required = false) StatoUtente stato) {
        return ResponseEntity.ok(gestioneAmministrazioneUtenti.searchUsers(new UserSearchCriteriaDTO(query, stato)));
    }

    @PostMapping("/utenti/{userId}/sospensione")
    @PreAuthorize("hasRole('GESTORE_UTENTI')")
    public ResponseEntity<MessageResponseDTO> suspendAccount(@AuthenticationPrincipal UserPrincipal principal,
                                                               @PathVariable Long userId,
                                                               @Valid @RequestBody SuspensionDTO dto) {
        gestioneAmministrazioneUtenti.suspendAccount(userId, dto, principal.getId());
        return ResponseEntity.ok(new MessageResponseDTO("Account sospeso con successo."));
    }

    @PostMapping("/utenti/{userId}/riattivazione")
    @PreAuthorize("hasRole('GESTORE_UTENTI')")
    public ResponseEntity<MessageResponseDTO> reactivateAccount(@PathVariable Long userId) {
        gestioneAmministrazioneUtenti.reactivateAccount(userId);
        return ResponseEntity.ok(new MessageResponseDTO("Account riattivato con successo."));
    }

    @PostMapping("/utenti/{userId}/esportazione-dati")
    @PreAuthorize("hasRole('GESTORE_UTENTI')")
    public ResponseEntity<MessageResponseDTO> exportUserDataAssisted(@PathVariable Long userId) {
        gestioneAmministrazioneUtenti.exportUserDataAssisted(userId);
        return ResponseEntity.accepted()
                .body(new MessageResponseDTO("Esportazione avviata: l'utente ricevera' un'email con i suoi dati in allegato."));
    }

    @GetMapping("/segnalazioni")
    @PreAuthorize("hasRole('GESTORE_UTENTI')")
    public ResponseEntity<List<ReportQueueItemDTO>> getReportsQueue() {
        return ResponseEntity.ok(gestioneAmministrazioneUtenti.getReportsQueue());
    }

    @PostMapping("/segnalazioni/{reportId}/risoluzione")
    @PreAuthorize("hasRole('GESTORE_UTENTI')")
    public ResponseEntity<MessageResponseDTO> resolveReport(@PathVariable Long reportId,
                                                              @Valid @RequestBody ReportResolutionDTO dto) {
        gestioneAmministrazioneUtenti.resolveReport(reportId, dto);
        return ResponseEntity.ok(new MessageResponseDTO("Segnalazione aggiornata con successo."));
    }

    @GetMapping("/richieste-cancellazione")
    @PreAuthorize("hasRole('GESTORE_UTENTI')")
    public ResponseEntity<List<DeletionRequestQueueItemDTO>> getDeletionRequestsQueue() {
        return ResponseEntity.ok(gestioneAmministrazioneUtenti.getDeletionRequestsQueue());
    }

    @PostMapping("/richieste-cancellazione/{requestId}/elaborazione")
    @PreAuthorize("hasRole('GESTORE_UTENTI')")
    public ResponseEntity<MessageResponseDTO> processAccountDeletion(@PathVariable Long requestId) {
        gestioneAmministrazioneUtenti.processAccountDeletion(requestId);
        return ResponseEntity.ok(new MessageResponseDTO("Cancellazione elaborata con successo."));
    }

    @GetMapping("/cronologia")
    @PreAuthorize("hasRole('GESTORE_UTENTI')")
    public ResponseEntity<List<AdministrativeActionLogEntryDTO>> getAdministrativeActionLog(
            @RequestParam(required = false) TipoAzioneAmministrativa tipoAzione,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(gestioneAmministrazioneUtenti.getAdministrativeActionLog(
                new AdministrativeActionLogFiltersDTO(tipoAzione, query)));
    }
}
