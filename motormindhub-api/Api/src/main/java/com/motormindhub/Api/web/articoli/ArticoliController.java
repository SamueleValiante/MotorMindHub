package com.motormindhub.Api.web.articoli;

import com.motormindhub.Api.model.entity.TipoLista;
import com.motormindhub.Api.security.UserPrincipal;
import com.motormindhub.Api.service.gestioneArticoli.GestioneArticoli;
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleDetailDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleDraftDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleSearchResultDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleSummaryDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleUpdateDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.OrdinamentoArticoli;
import com.motormindhub.Api.service.gestioneArticoli.dto.SaveArticleDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.SavedArticleDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.SearchCriteriaDTO;
import com.motormindhub.Api.web.MessageResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller di GestioneArticoli (SDD 3, ODD 2.2). Le regole di autorizzazione seguono la
 * matrice Access Control & Security dell'SDD (3.4, Tabella 1): lettura pubblica, liste personali
 * per l'Iscritto, scrittura per Autore/Manager Autori.
 */
@RestController
@RequestMapping("/api/v1/articoli")
public class ArticoliController {

    private final GestioneArticoli gestioneArticoli;

    public ArticoliController(GestioneArticoli gestioneArticoli) {
        this.gestioneArticoli = gestioneArticoli;
    }

    @GetMapping
    public ResponseEntity<ArticleSearchResultDTO> searchArticles(@RequestParam(required = false) String query,
                                                                   @RequestParam(required = false) List<Long> categoriaIds,
                                                                   @RequestParam(required = false) Integer pagina,
                                                                   @RequestParam(required = false) Integer dimensionePagina,
                                                                   @RequestParam(required = false) OrdinamentoArticoli ordinamento) {
        SearchCriteriaDTO criteria = new SearchCriteriaDTO(query, categoriaIds, pagina, dimensionePagina, ordinamento);
        return ResponseEntity.ok(gestioneArticoli.searchArticles(criteria));
    }

    @GetMapping("/{articleId:[0-9]+}")
    public ResponseEntity<ArticleDetailDTO> getArticleById(@PathVariable Long articleId) {
        return ResponseEntity.ok(gestioneArticoli.getArticleById(articleId));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('AUTORE', 'MANAGER_AUTORI')")
    public ResponseEntity<List<ArticleSummaryDTO>> getArticlesByAuthor(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(gestioneArticoli.getArticlesByAuthor(principal.getId()));
    }

    @GetMapping("/salvataggi")
    public ResponseEntity<List<SavedArticleDTO>> getSavedArticles(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(gestioneArticoli.getSavedArticles(principal.getId()));
    }

    @PostMapping("/bozze")
    @PreAuthorize("hasAnyRole('AUTORE', 'MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> createDraft(@AuthenticationPrincipal UserPrincipal principal,
                                                            @Valid @RequestBody ArticleDraftDTO dto) {
        gestioneArticoli.createDraft(principal.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponseDTO("Bozza creata con successo."));
    }

    @PutMapping("/bozze/{draftId}")
    @PreAuthorize("hasAnyRole('AUTORE', 'MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> updateDraft(@AuthenticationPrincipal UserPrincipal principal,
                                                            @PathVariable Long draftId,
                                                            @Valid @RequestBody ArticleDraftDTO dto) {
        gestioneArticoli.updateDraft(draftId, principal.getId(), dto);
        return ResponseEntity.ok(new MessageResponseDTO("Bozza aggiornata con successo."));
    }

    @PostMapping("/bozze/{draftId}/pubblicazione")
    @PreAuthorize("hasAnyRole('AUTORE', 'MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> publishArticle(@AuthenticationPrincipal UserPrincipal principal,
                                                               @PathVariable Long draftId) {
        gestioneArticoli.publishArticle(draftId, principal.getId());
        return ResponseEntity.ok(new MessageResponseDTO("Articolo inviato in approvazione."));
    }

    @PutMapping("/{articleId}")
    @PreAuthorize("hasAnyRole('AUTORE', 'MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> updatePublishedArticle(@AuthenticationPrincipal UserPrincipal principal,
                                                                       @PathVariable Long articleId,
                                                                       @Valid @RequestBody ArticleUpdateDTO dto) {
        gestioneArticoli.updatePublishedArticle(articleId, principal.getId(), dto);
        return ResponseEntity.ok(new MessageResponseDTO("Articolo aggiornato con successo."));
    }

    @DeleteMapping("/bozze/{draftId}")
    @PreAuthorize("hasAnyRole('AUTORE', 'MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> deleteDraft(@AuthenticationPrincipal UserPrincipal principal,
                                                            @PathVariable Long draftId) {
        gestioneArticoli.deleteDraft(draftId, principal.getId());
        return ResponseEntity.ok(new MessageResponseDTO("Bozza eliminata con successo."));
    }

    @DeleteMapping("/{articleId}")
    @PreAuthorize("hasAnyRole('AUTORE', 'MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> deleteArticle(@AuthenticationPrincipal UserPrincipal principal,
                                                              @PathVariable Long articleId) {
        gestioneArticoli.deleteArticle(articleId, principal.getId());
        return ResponseEntity.ok(new MessageResponseDTO("Articolo eliminato con successo."));
    }

    @PostMapping("/{articleId}/salvataggi")
    public ResponseEntity<MessageResponseDTO> saveArticleToList(@AuthenticationPrincipal UserPrincipal principal,
                                                                  @PathVariable Long articleId,
                                                                  @Valid @RequestBody SaveArticleDTO dto) {
        gestioneArticoli.saveArticleToList(principal.getId(), articleId, dto.tipoLista());
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponseDTO("Articolo salvato con successo."));
    }

    @DeleteMapping("/{articleId}/salvataggi/{tipoLista}")
    public ResponseEntity<MessageResponseDTO> removeArticleFromList(@AuthenticationPrincipal UserPrincipal principal,
                                                                      @PathVariable Long articleId,
                                                                      @PathVariable TipoLista tipoLista) {
        gestioneArticoli.removeArticleFromList(principal.getId(), articleId, tipoLista);
        return ResponseEntity.ok(new MessageResponseDTO("Articolo rimosso dai salvati."));
    }
}
