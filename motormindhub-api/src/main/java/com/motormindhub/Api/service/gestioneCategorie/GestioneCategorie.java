package com.motormindhub.Api.service.gestioneCategorie;

import com.motormindhub.Api.events.CategoriaEliminataEvent;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryAncestorDTO;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryDTO;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryResponseDTO;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryTreeNodeDTO;
import com.motormindhub.Api.service.gestioneCategorie.dto.ReassignCategoryDTO;
import com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaConSottocategorieException;
import com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaGiaEsistenteException;
import com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaNonTrovataException;
import com.motormindhub.Api.service.gestioneCategorie.exception.RegolaDiDominioViolataException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Facade del sottosistema GestioneCategorie (SDD 3.1, ODD 2.3): gestione dell'albero gerarchico
 * di navigazione dei contenuti.
 */
@Service
public class GestioneCategorie {

    private final CategoriaRepository categoriaRepository;
    private final ApplicationEventPublisher eventPublisher;

    public GestioneCategorie(CategoriaRepository categoriaRepository, ApplicationEventPublisher eventPublisher) {
        this.categoriaRepository = categoriaRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * pre: not exists c | c.nome = dto.nome and c.categoriaPadre.id = dto.categoriaPadreId
     * post: exists c | c.nome = dto.nome and c.categoriaPadre.id = dto.categoriaPadreId
     * (ODD 2.3, RF2.5, UC_12)
     */
    @Transactional
    public Long createCategory(CategoryDTO dto) {
        Categoria categoriaPadre = null;
        if (dto.categoriaPadreId() != null) {
            categoriaPadre = categoriaRepository.findById(dto.categoriaPadreId())
                    .orElseThrow(() -> new CategoriaNonTrovataException("Categoria padre non trovata."));
        }

        if (categoriaRepository.existsByNomeAndCategoriaPadreId(dto.nome(), dto.categoriaPadreId())) {
            throw new CategoriaGiaEsistenteException(
                    "Esiste gia' una categoria con questo nome nello stesso ramo dell'albero.");
        }

        Categoria categoria = new Categoria(dto.nome(), dto.descrizione(), categoriaPadre);
        categoria = categoriaRepository.save(categoria);
        return categoria.getId();
    }

    /**
     * pre: exists c | c.id = categoryId  and  dto.nome.size() > 0
     * post: Categoria.allInstances()->select(c | c.id = categoryId).descrizione = dto.descrizione
     * (ODD 2.3, RF2.6, UC_14)
     *
     * Nota: nome e categoriaPadreId del DTO non vengono applicati - questo metodo modifica
     * esclusivamente il testo descrittivo (RF2.6), coerentemente col post-condition OCL. Il campo
     * dto.nome resta comunque parte della pre-condizione perche' CategoryDTO e' condiviso con
     * createCategory (SDD 4.3).
     */
    @Transactional
    public void updateCategory(Long categoryId, CategoryDTO dto) {
        if (dto.nome() == null || dto.nome().isBlank()) {
            throw new RegolaDiDominioViolataException("Il campo 'Nome' e' obbligatorio.");
        }

        Categoria categoria = categoriaRepository.findById(categoryId)
                .orElseThrow(() -> new CategoriaNonTrovataException("Categoria non trovata."));

        categoria.setDescrizione(dto.descrizione());
    }

    /**
     * pre: exists c | c.id = categoryId
     *      and exists c | c.id = dto.categoriaDestinazioneId and c.id &lt;&gt; categoryId
     * post: not exists c | c.id = categoryId
     *       and gli Articolo che puntavano a categoryId ora puntano a dto.categoriaDestinazioneId
     * (ODD 2.3, RF3.5, UC_13)
     *
     * La riassegnazione degli articoli orfani e' delegata al listener sincrono di GestioneArticoli
     * (CategoriaEliminataListener), che consuma CategoriaEliminataEvent. L'evento va pubblicato
     * PRIMA della cancellazione della riga, non dopo: essendo il publisher sincrono (nessun @Async
     * qui, a differenza dei listener di GestioneNotifiche), il listener riassegna gli Articolo
     * all'interno della stessa transazione, cosi' il vincolo di integrita' referenziale
     * articoli.categoria_id non viene mai violato al momento della DELETE.
     */
    @Transactional
    public void deleteCategory(Long categoryId, ReassignCategoryDTO dto) {
        Categoria categoria = categoriaRepository.findById(categoryId)
                .orElseThrow(() -> new CategoriaNonTrovataException("Categoria da eliminare non trovata."));

        if (categoryId.equals(dto.categoriaDestinazioneId())) {
            throw new RegolaDiDominioViolataException(
                    "La categoria di destinazione deve essere diversa dalla categoria da eliminare.");
        }

        if (!categoriaRepository.existsById(dto.categoriaDestinazioneId())) {
            throw new CategoriaNonTrovataException("Categoria di destinazione non trovata.");
        }

        if (categoriaRepository.existsByCategoriaPadreId(categoryId)) {
            throw new CategoriaConSottocategorieException(
                    "Impossibile eliminare una categoria che contiene sottocategorie: riassegnale prima di procedere.");
        }

        eventPublisher.publishEvent(new CategoriaEliminataEvent(categoryId, dto.categoriaDestinazioneId()));
        categoriaRepository.delete(categoria);
    }

    /** Query di sola lettura (RF1.2) - nessun contratto OCL formale. */
    @Transactional(readOnly = true)
    public CategoryResponseDTO getCategoryById(Long categoryId) {
        Categoria categoria = categoriaRepository.findById(categoryId)
                .orElseThrow(() -> new CategoriaNonTrovataException("Categoria non trovata."));

        Long categoriaPadreId = categoria.getCategoriaPadre() != null ? categoria.getCategoriaPadre().getId() : null;
        return new CategoryResponseDTO(categoria.getId(), categoria.getNome(), categoria.getDescrizione(), categoriaPadreId);
    }

    /** Query di sola lettura (RF1.2) - nessun contratto OCL formale. */
    @Transactional(readOnly = true)
    public List<CategoryTreeNodeDTO> getCategoryTree() {
        List<Categoria> tutte = categoriaRepository.findAll();

        Map<Long, List<Categoria>> figliePerPadre = tutte.stream()
                .filter(c -> c.getCategoriaPadre() != null)
                .collect(Collectors.groupingBy(c -> c.getCategoriaPadre().getId()));

        return tutte.stream()
                .filter(c -> c.getCategoriaPadre() == null)
                .map(radice -> costruisciNodo(radice, figliePerPadre))
                .toList();
    }

    /**
     * Query di sola lettura (RF1.2) - nessun contratto OCL formale. Risale la gerarchia da
     * categoryId fino alla radice seguendo categoriaPadre e restituisce la catena in ordine
     * radice -> foglia (categoryId incluso, come ultimo elemento) - usata dal breadcrumb del
     * Dettaglio Articolo (GestioneArticoli.mappaDettaglio) oltre che da eventuali consumer diretti
     * di GestioneCategorie.
     */
    @Transactional(readOnly = true)
    public List<CategoryAncestorDTO> getCategoryPath(Long categoryId) {
        Categoria categoria = categoriaRepository.findById(categoryId)
                .orElseThrow(() -> new CategoriaNonTrovataException("Categoria non trovata."));

        Deque<CategoryAncestorDTO> catena = new ArrayDeque<>();
        Categoria corrente = categoria;
        while (corrente != null) {
            catena.addFirst(new CategoryAncestorDTO(corrente.getId(), corrente.getNome()));
            corrente = corrente.getCategoriaPadre();
        }
        return List.copyOf(catena);
    }

    private CategoryTreeNodeDTO costruisciNodo(Categoria categoria, Map<Long, List<Categoria>> figliePerPadre) {
        List<CategoryTreeNodeDTO> figlie = figliePerPadre.getOrDefault(categoria.getId(), List.of()).stream()
                .map(figlia -> costruisciNodo(figlia, figliePerPadre))
                .toList();
        return new CategoryTreeNodeDTO(categoria.getId(), categoria.getNome(), categoria.getDescrizione(), figlie);
    }
}
