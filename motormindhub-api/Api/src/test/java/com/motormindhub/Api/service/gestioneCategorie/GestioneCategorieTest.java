package com.motormindhub.Api.service.gestioneCategorie;

import com.motormindhub.Api.events.CategoriaEliminataEvent;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryDTO;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryResponseDTO;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryTreeNodeDTO;
import com.motormindhub.Api.service.gestioneCategorie.dto.ReassignCategoryDTO;
import com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaConSottocategorieException;
import com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaGiaEsistenteException;
import com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaNonTrovataException;
import com.motormindhub.Api.service.gestioneCategorie.exception.RegolaDiDominioViolataException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Un test per ciascun contratto OCL di GestioneCategorie (ODD 2.3): un caso verifica la
 * post-condizione quando la pre-condizione e' soddisfatta, uno o piu' casi verificano che la
 * violazione della pre-condizione sollevi l'eccezione applicativa attesa.
 */
@ExtendWith(MockitoExtension.class)
class GestioneCategorieTest {

    @Mock
    private CategoriaRepository categoriaRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private GestioneCategorie gestioneCategorie;

    @BeforeEach
    void setUp() {
        gestioneCategorie = new GestioneCategorie(categoriaRepository, eventPublisher);
    }

    private static Categoria categoria(Long id, String nome, Categoria padre) {
        Categoria categoria = new Categoria(nome, "descrizione originale", padre);
        ReflectionTestUtils.setField(categoria, "id", id);
        return categoria;
    }

    // --- createCategory ---------------------------------------------------

    @Test
    void createCategory_creaCategoriaRadice_quandoNomeNonDuplicatoENessunPadre() {
        CategoryDTO dto = new CategoryDTO("Manutenzione ordinaria", null, "Guide di manutenzione");
        when(categoriaRepository.existsByNomeAndCategoriaPadreId("Manutenzione ordinaria", null)).thenReturn(false);
        when(categoriaRepository.save(any(Categoria.class))).thenAnswer(invocation -> {
            Categoria salvata = invocation.getArgument(0);
            ReflectionTestUtils.setField(salvata, "id", 10L);
            return salvata;
        });

        Long id = gestioneCategorie.createCategory(dto);

        assertThat(id).isEqualTo(10L);
        ArgumentCaptor<Categoria> captor = ArgumentCaptor.forClass(Categoria.class);
        verify(categoriaRepository).save(captor.capture());
        assertThat(captor.getValue().getNome()).isEqualTo("Manutenzione ordinaria");
        assertThat(captor.getValue().getCategoriaPadre()).isNull();
    }

    @Test
    void createCategory_creaSottocategoria_quandoPadreEsiste() {
        Categoria padre = categoria(1L, "Alimentazioni Alternative", null);
        CategoryDTO dto = new CategoryDTO("Auto a Idrogeno", 1L, "Veicoli a celle a combustibile");
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(padre));
        when(categoriaRepository.existsByNomeAndCategoriaPadreId("Auto a Idrogeno", 1L)).thenReturn(false);
        when(categoriaRepository.save(any(Categoria.class))).thenAnswer(invocation -> invocation.getArgument(0));

        gestioneCategorie.createCategory(dto);

        ArgumentCaptor<Categoria> captor = ArgumentCaptor.forClass(Categoria.class);
        verify(categoriaRepository).save(captor.capture());
        assertThat(captor.getValue().getCategoriaPadre()).isEqualTo(padre);
    }

    @Test
    void createCategory_lanciaEccezione_quandoNomeGiaEsistenteNelloStessoRamo() {
        CategoryDTO dto = new CategoryDTO("Impianto Frenante", null, null);
        when(categoriaRepository.existsByNomeAndCategoriaPadreId("Impianto Frenante", null)).thenReturn(true);

        assertThrows(CategoriaGiaEsistenteException.class, () -> gestioneCategorie.createCategory(dto));
        verify(categoriaRepository, never()).save(any());
    }

    @Test
    void createCategory_lanciaEccezione_quandoCategoriaPadreInesistente() {
        CategoryDTO dto = new CategoryDTO("Auto a Idrogeno", 99L, null);
        when(categoriaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(CategoriaNonTrovataException.class, () -> gestioneCategorie.createCategory(dto));
        verify(categoriaRepository, never()).save(any());
    }

    // --- updateCategory -----------------------------------------------------

    @Test
    void updateCategory_aggiornaSoloDescrizione_quandoCategoriaEsisteENomeValido() {
        Categoria padreOriginale = categoria(1L, "Pneumatici e Cerchi", null);
        Categoria esistente = categoria(2L, "Pneumatici e Cerchi", padreOriginale);
        when(categoriaRepository.findById(2L)).thenReturn(Optional.of(esistente));
        CategoryDTO dto = new CategoryDTO("Nome ignorato", 999L, "Descrizione corretta senza refusi");

        gestioneCategorie.updateCategory(2L, dto);

        assertThat(esistente.getDescrizione()).isEqualTo("Descrizione corretta senza refusi");
        // nome e categoriaPadre restano immutabili (RF2.6): l'entita' non espone setter per questi campi.
        assertThat(esistente.getNome()).isEqualTo("Pneumatici e Cerchi");
        assertThat(esistente.getCategoriaPadre()).isEqualTo(padreOriginale);
    }

    @Test
    void updateCategory_lanciaEccezione_quandoCategoriaInesistente() {
        when(categoriaRepository.findById(99L)).thenReturn(Optional.empty());
        CategoryDTO dto = new CategoryDTO("Nome valido", null, "Descrizione");

        assertThrows(CategoriaNonTrovataException.class, () -> gestioneCategorie.updateCategory(99L, dto));
    }

    @Test
    void updateCategory_lanciaEccezione_quandoNomeDtoVuoto() {
        CategoryDTO dto = new CategoryDTO("   ", null, "Descrizione");

        assertThrows(RegolaDiDominioViolataException.class, () -> gestioneCategorie.updateCategory(1L, dto));
        verify(categoriaRepository, never()).findById(any());
    }

    // --- deleteCategory -----------------------------------------------------

    @Test
    void deleteCategory_eliminaCategoriaEPubblicaEvento_quandoDestinazioneValidaESenzaSottocategorie() {
        Categoria daEliminare = categoria(1L, "Propulsori a Combustione", null);
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(daEliminare));
        when(categoriaRepository.existsById(2L)).thenReturn(true);
        when(categoriaRepository.existsByCategoriaPadreId(1L)).thenReturn(false);
        ReassignCategoryDTO dto = new ReassignCategoryDTO(2L);

        gestioneCategorie.deleteCategory(1L, dto);

        verify(categoriaRepository).delete(daEliminare);
        ArgumentCaptor<CategoriaEliminataEvent> captor = ArgumentCaptor.forClass(CategoriaEliminataEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().categoriaEliminataId()).isEqualTo(1L);
        assertThat(captor.getValue().categoriaDestinazioneId()).isEqualTo(2L);
    }

    @Test
    void deleteCategory_lanciaEccezione_quandoCategoriaInesistente() {
        when(categoriaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(CategoriaNonTrovataException.class,
                () -> gestioneCategorie.deleteCategory(99L, new ReassignCategoryDTO(2L)));
        verify(categoriaRepository, never()).delete(any());
    }

    @Test
    void deleteCategory_lanciaEccezione_quandoDestinazioneUgualeAllaCategoriaDaEliminare() {
        Categoria daEliminare = categoria(1L, "Motori Termici", null);
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(daEliminare));

        assertThrows(RegolaDiDominioViolataException.class,
                () -> gestioneCategorie.deleteCategory(1L, new ReassignCategoryDTO(1L)));
        verify(categoriaRepository, never()).delete(any());
    }

    @Test
    void deleteCategory_lanciaEccezione_quandoDestinazioneInesistente() {
        Categoria daEliminare = categoria(1L, "Motori Termici", null);
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(daEliminare));
        when(categoriaRepository.existsById(99L)).thenReturn(false);

        assertThrows(CategoriaNonTrovataException.class,
                () -> gestioneCategorie.deleteCategory(1L, new ReassignCategoryDTO(99L)));
        verify(categoriaRepository, never()).delete(any());
    }

    @Test
    void deleteCategory_lanciaEccezione_quandoLaCategoriaHaSottocategorie() {
        Categoria daEliminare = categoria(1L, "Motori Termici", null);
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(daEliminare));
        when(categoriaRepository.existsById(2L)).thenReturn(true);
        when(categoriaRepository.existsByCategoriaPadreId(1L)).thenReturn(true);

        assertThrows(CategoriaConSottocategorieException.class,
                () -> gestioneCategorie.deleteCategory(1L, new ReassignCategoryDTO(2L)));
        verify(categoriaRepository, never()).delete(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    // --- getCategoryById (query) ---------------------------------------------

    @Test
    void getCategoryById_restituisceDettagli_quandoCategoriaEsiste() {
        Categoria padre = categoria(1L, "Manutenzione ordinaria", null);
        Categoria figlia = categoria(2L, "Impianto Frenante", padre);
        when(categoriaRepository.findById(2L)).thenReturn(Optional.of(figlia));

        CategoryResponseDTO risultato = gestioneCategorie.getCategoryById(2L);

        assertThat(risultato.id()).isEqualTo(2L);
        assertThat(risultato.nome()).isEqualTo("Impianto Frenante");
        assertThat(risultato.categoriaPadreId()).isEqualTo(1L);
    }

    @Test
    void getCategoryById_lanciaEccezione_quandoCategoriaInesistente() {
        when(categoriaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(CategoriaNonTrovataException.class, () -> gestioneCategorie.getCategoryById(99L));
    }

    // --- getCategoryTree (query) ----------------------------------------------

    @Test
    void getCategoryTree_costruisceAlberoGerarchicoDaListaPiatta() {
        Categoria radice = categoria(1L, "Manutenzione ordinaria", null);
        Categoria figlia = categoria(2L, "Componentistica", radice);
        Categoria nipote = categoria(3L, "Impianto Frenante", figlia);
        Categoria altraRadice = categoria(4L, "Case automobilistiche", null);
        when(categoriaRepository.findAll()).thenReturn(List.of(radice, figlia, nipote, altraRadice));

        List<CategoryTreeNodeDTO> albero = gestioneCategorie.getCategoryTree();

        assertThat(albero).hasSize(2);
        CategoryTreeNodeDTO nodoRadice = albero.stream().filter(n -> n.id().equals(1L)).findFirst().orElseThrow();
        assertThat(nodoRadice.figlie()).hasSize(1);
        assertThat(nodoRadice.figlie().get(0).id()).isEqualTo(2L);
        assertThat(nodoRadice.figlie().get(0).figlie()).hasSize(1);
        assertThat(nodoRadice.figlie().get(0).figlie().get(0).id()).isEqualTo(3L);

        CategoryTreeNodeDTO altroNodoRadice = albero.stream().filter(n -> n.id().equals(4L)).findFirst().orElseThrow();
        assertThat(altroNodoRadice.figlie()).isEmpty();
    }
}
