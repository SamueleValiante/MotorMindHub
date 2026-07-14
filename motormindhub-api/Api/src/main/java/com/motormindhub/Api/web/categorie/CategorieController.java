package com.motormindhub.Api.web.categorie;

import com.motormindhub.Api.service.gestioneCategorie.GestioneCategorie;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryDTO;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryResponseDTO;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryTreeNodeDTO;
import com.motormindhub.Api.service.gestioneCategorie.dto.ReassignCategoryDTO;
import com.motormindhub.Api.web.MessageResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller di GestioneCategorie (SDD 3, ODD 2.3). Le regole di autorizzazione seguono la
 * matrice Access Control & Security dell'SDD (3.4, Tabella 1): lettura pubblica, scrittura per
 * Autore/Manager Autori, eliminazione riservata al Manager Autori.
 */
@RestController
@RequestMapping("/api/v1/categorie")
public class CategorieController {

    private final GestioneCategorie gestioneCategorie;

    public CategorieController(GestioneCategorie gestioneCategorie) {
        this.gestioneCategorie = gestioneCategorie;
    }

    @GetMapping
    public ResponseEntity<List<CategoryTreeNodeDTO>> getCategoryTree() {
        return ResponseEntity.ok(gestioneCategorie.getCategoryTree());
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(@PathVariable Long categoryId) {
        return ResponseEntity.ok(gestioneCategorie.getCategoryById(categoryId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('AUTORE', 'MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> createCategory(@Valid @RequestBody CategoryDTO dto) {
        gestioneCategorie.createCategory(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponseDTO("Categoria creata con successo."));
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasAnyRole('AUTORE', 'MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> updateCategory(@PathVariable Long categoryId,
                                                               @Valid @RequestBody CategoryDTO dto) {
        gestioneCategorie.updateCategory(categoryId, dto);
        return ResponseEntity.ok(new MessageResponseDTO("Categoria aggiornata con successo."));
    }

    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasRole('MANAGER_AUTORI')")
    public ResponseEntity<MessageResponseDTO> deleteCategory(@PathVariable Long categoryId,
                                                               @Valid @RequestBody ReassignCategoryDTO dto) {
        gestioneCategorie.deleteCategory(categoryId, dto);
        return ResponseEntity.ok(new MessageResponseDTO("Categoria eliminata e articoli riassegnati."));
    }
}
