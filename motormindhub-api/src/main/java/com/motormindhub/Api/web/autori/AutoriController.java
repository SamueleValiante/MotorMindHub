package com.motormindhub.Api.web.autori;

import com.motormindhub.Api.service.gestioneAutori.GestioneAutori;
import com.motormindhub.Api.service.gestioneAutori.dto.AuthorSummaryDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.CategoriaPiuLettaDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.InviteAuthorDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.ManagerDashboardStatsDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.PendingArticleDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.PuntoAndamentoApprovazioniDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.PuntoAndamentoCategorieDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.PuntoAndamentoLettureDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.PuntoAndamentoPubblicazioniDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.RejectionReasonDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.RemoveAuthorPolicyDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.SetPasswordDTO;
import com.motormindhub.Api.web.MessageResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller di GestioneAutori (SDD 3, ODD 2.4). Interamente riservato al Manager Autori
 * (SDD 3.4, Tabella 1), a eccezione di accettazione/rifiuto invito: l'invitato non possiede ancora
 * un account nel momento in cui clicca il link ricevuto via email (mockup 33_invito_accettazione.png,
 * nav bar in stato Guest).
 */
@RestController
@RequestMapping("/api/v1/autori")
public class AutoriController {

    private final GestioneAutori gestioneAutori;

    public AutoriController(GestioneAutori gestioneAutori) {
        this.gestioneAutori = gestioneAutori;
    }

    @PostMapping("/inviti")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> inviteAuthor(@Valid @RequestBody InviteAuthorDTO dto) {
        gestioneAutori.inviteAuthor(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponseDTO("Invito inviato con successo."));
    }

    @PostMapping("/inviti/{token}/accetta")
    public ResponseEntity<MessageResponseDTO> acceptInvite(@PathVariable String token,
                                                             @Valid @RequestBody SetPasswordDTO dto) {
        gestioneAutori.acceptInvite(token, dto);
        return ResponseEntity.ok(new MessageResponseDTO("Invito accettato: il tuo account e' stato attivato."));
    }

    @PostMapping("/inviti/{token}/rifiuta")
    public ResponseEntity<MessageResponseDTO> declineInvite(@PathVariable String token) {
        gestioneAutori.declineInvite(token);
        return ResponseEntity.ok(new MessageResponseDTO("Invito rifiutato."));
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<List<AuthorSummaryDTO>> listAuthors() {
        return ResponseEntity.ok(gestioneAutori.listAuthors());
    }

    @DeleteMapping("/{authorId}")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> removeAuthor(@PathVariable Long authorId,
                                                             @Valid @RequestBody RemoveAuthorPolicyDTO dto) {
        gestioneAutori.removeAuthor(authorId, dto);
        return ResponseEntity.ok(new MessageResponseDTO("Autore rimosso con successo."));
    }

    @GetMapping("/articoli-in-attesa")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<List<PendingArticleDTO>> getPendingArticles() {
        return ResponseEntity.ok(gestioneAutori.getPendingArticles());
    }

    @PostMapping("/articoli/{articleId}/approvazione")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> approveArticle(@PathVariable Long articleId) {
        gestioneAutori.approveArticle(articleId);
        return ResponseEntity.ok(new MessageResponseDTO("Articolo approvato e pubblicato."));
    }

    @PostMapping("/articoli/{articleId}/rifiuto")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> rejectArticle(@PathVariable Long articleId,
                                                              @Valid @RequestBody RejectionReasonDTO dto) {
        gestioneAutori.rejectArticle(articleId, dto);
        return ResponseEntity.ok(new MessageResponseDTO("Articolo rifiutato."));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<ManagerDashboardStatsDTO> getManagerDashboardStats() {
        return ResponseEntity.ok(gestioneAutori.getManagerDashboardStats());
    }

    @GetMapping("/statistiche-autori/andamento-pubblicazioni")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<List<PuntoAndamentoPubblicazioniDTO>> getAndamentoPubblicazioni(
            @RequestParam(defaultValue = "30") int giorni) {
        return ResponseEntity.ok(gestioneAutori.andamentoPubblicazioni(giorni));
    }

    @GetMapping("/statistiche-autori/andamento-categorie")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<List<PuntoAndamentoCategorieDTO>> getAndamentoCategorie(
            @RequestParam(defaultValue = "30") int giorni) {
        return ResponseEntity.ok(gestioneAutori.andamentoCategorie(giorni));
    }

    @GetMapping("/statistiche-autori/andamento-approvazioni")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<List<PuntoAndamentoApprovazioniDTO>> getAndamentoApprovazioni(
            @RequestParam(defaultValue = "30") int giorni) {
        return ResponseEntity.ok(gestioneAutori.andamentoApprovazioni(giorni));
    }

    @GetMapping("/statistiche-autori/andamento-letture")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<List<PuntoAndamentoLettureDTO>> getAndamentoLetture(
            @RequestParam(defaultValue = "30") int giorni) {
        return ResponseEntity.ok(gestioneAutori.andamentoLetture(giorni));
    }

    @GetMapping("/statistiche-autori/categorie-piu-lette")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<List<CategoriaPiuLettaDTO>> getCategoriePiuLette() {
        return ResponseEntity.ok(gestioneAutori.getCategoriePiuLette());
    }
}
