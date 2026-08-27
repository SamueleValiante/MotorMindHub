package com.motormindhub.Api.service.gestioneArticoli;

import com.motormindhub.Api.model.entity.Articolo;
import com.motormindhub.Api.model.entity.ArticoloSalvato;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoArticolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoLista;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.entity.VisualizzazioneArticolo;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.ArticoloSalvatoRepository;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.model.repository.ConteggioSalvataggiPerArticolo;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.model.repository.VisualizzazioneArticoloRepository;
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleDetailDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleDraftDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleUpdateDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.AuthorArticleSummaryDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.SavedArticleDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.SearchCriteriaDTO;
import com.motormindhub.Api.service.gestioneArticoli.exception.ArticoloGiaSalvatoException;
import com.motormindhub.Api.service.gestioneArticoli.exception.ArticoloNonSalvatoException;
import com.motormindhub.Api.service.gestioneArticoli.exception.ArticoloNonTrovatoException;
import com.motormindhub.Api.service.gestioneArticoli.exception.AutoreNonValidoException;
import com.motormindhub.Api.service.gestioneArticoli.exception.CategoriaNonTrovataException;
import com.motormindhub.Api.service.gestioneArticoli.exception.RegolaDiDominioViolataException;
import com.motormindhub.Api.service.gestioneArticoli.exception.StatoArticoloNonValidoException;
import com.motormindhub.Api.service.gestioneCategorie.GestioneCategorie;
import com.motormindhub.Api.service.gestioneCategorie.dto.CategoryAncestorDTO;
import com.motormindhub.Api.service.storage.CloudStorageService;
import com.motormindhub.Api.service.storage.ImageUploadValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Un test per ciascun contratto OCL di GestioneArticoli (ODD 2.2): un caso verifica la
 * post-condizione quando la pre-condizione e' soddisfatta, uno o piu' casi verificano che la
 * violazione della pre-condizione sollevi l'eccezione applicativa attesa. Include anche i test per
 * il controllo di ownership aggiunto su richiesta esplicita, non presente nell'OCL letterale.
 */
@ExtendWith(MockitoExtension.class)
class GestioneArticoliTest {

    @Mock
    private ArticoloRepository articoloRepository;
    @Mock
    private ArticoloSalvatoRepository articoloSalvatoRepository;
    @Mock
    private CategoriaRepository categoriaRepository;
    @Mock
    private UtenteRepository utenteRepository;
    @Mock
    private VisualizzazioneArticoloRepository visualizzazioneArticoloRepository;
    @Mock
    private CloudStorageService cloudStorageService;
    @Mock
    private ImageUploadValidator imageUploadValidator;
    @Mock
    private GestioneCategorie gestioneCategorie;

    private GestioneArticoli gestioneArticoli;

    @BeforeEach
    void setUp() {
        gestioneArticoli = new GestioneArticoli(articoloRepository, articoloSalvatoRepository, categoriaRepository,
                utenteRepository, visualizzazioneArticoloRepository, cloudStorageService, imageUploadValidator,
                gestioneCategorie);
    }

    private static Utente utente(Long id, Ruolo ruolo) {
        Utente u = new Utente("Giulia", "Rossi", "utente" + id + "@provider.it", "hash", null, null, true, null);
        ReflectionTestUtils.setField(u, "id", id);
        u.setRuolo(ruolo);
        u.setStato(StatoUtente.ATTIVO);
        return u;
    }

    private static Categoria categoria(Long id) {
        Categoria c = new Categoria("Manutenzione ordinaria", "descrizione", null);
        ReflectionTestUtils.setField(c, "id", id);
        return c;
    }

    private static Articolo articolo(Long id, Utente autore, Categoria categoria, StatoArticolo stato, String titolo) {
        Articolo a = new Articolo(autore, titolo, "Testo di prova", categoria, "freni,manutenzione", null);
        ReflectionTestUtils.setField(a, "id", id);
        a.setStato(stato);
        return a;
    }

    // --- createDraft ---------------------------------------------------

    @Test
    void createDraft_creaArticoloInBozza_quandoAutoreValido() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(autore));
        when(articoloRepository.save(any(Articolo.class))).thenAnswer(inv -> {
            Articolo salvato = inv.getArgument(0);
            ReflectionTestUtils.setField(salvato, "id", 100L);
            return salvato;
        });
        ArticleDraftDTO dto = new ArticleDraftDTO("Candele adatte per Ape50", null, null, List.of("candele"), null);

        Long id = gestioneArticoli.createDraft(1L, dto);

        assertThat(id).isEqualTo(100L);
        ArgumentCaptor<Articolo> captor = ArgumentCaptor.forClass(Articolo.class);
        verify(articoloRepository).save(captor.capture());
        assertThat(captor.getValue().getStato()).isEqualTo(StatoArticolo.BOZZA);
        assertThat(captor.getValue().getAutore()).isEqualTo(autore);
    }

    @Test
    void createDraft_creaArticolo_quandoAutoreEManagerAutori() {
        Utente manager = utente(2L, Ruolo.MANAGER_AUTORI);
        when(utenteRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(articoloRepository.save(any(Articolo.class))).thenAnswer(inv -> inv.getArgument(0));
        ArticleDraftDTO dto = new ArticleDraftDTO(null, null, null, null, null);

        gestioneArticoli.createDraft(2L, dto);

        verify(articoloRepository).save(any(Articolo.class));
    }

    @Test
    void createDraft_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());
        ArticleDraftDTO dto = new ArticleDraftDTO(null, null, null, null, null);

        assertThrows(AutoreNonValidoException.class, () -> gestioneArticoli.createDraft(99L, dto));
        verify(articoloRepository, never()).save(any());
    }

    @Test
    void createDraft_lanciaEccezione_quandoRuoloNonAutorizzato() {
        Utente iscritto = utente(3L, Ruolo.ISCRITTO);
        when(utenteRepository.findById(3L)).thenReturn(Optional.of(iscritto));
        ArticleDraftDTO dto = new ArticleDraftDTO(null, null, null, null, null);

        assertThrows(AutoreNonValidoException.class, () -> gestioneArticoli.createDraft(3L, dto));
        verify(articoloRepository, never()).save(any());
    }

    @Test
    void createDraft_lanciaEccezione_quandoCategoriaInesistente() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(autore));
        when(categoriaRepository.findById(50L)).thenReturn(Optional.empty());
        ArticleDraftDTO dto = new ArticleDraftDTO("Titolo", "Testo", 50L, null, null);

        assertThrows(CategoriaNonTrovataException.class, () -> gestioneArticoli.createDraft(1L, dto));
    }

    // --- updateDraft -----------------------------------------------------

    @Test
    void updateDraft_aggiornaTitolo_quandoBozzaEProprietario() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, null, StatoArticolo.BOZZA, "Titolo vecchio");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));
        ArticleDraftDTO dto = new ArticleDraftDTO("Titolo nuovo", "Testo nuovo", null, null, null);

        gestioneArticoli.updateDraft(10L, 1L, dto);

        assertThat(bozza.getTitolo()).isEqualTo("Titolo nuovo");
    }

    @Test
    void updateDraft_consentito_quandoChiamanteEManagerAutoriNonProprietario() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Utente manager = utente(2L, Ruolo.MANAGER_AUTORI);
        Articolo bozza = articolo(10L, autore, null, StatoArticolo.BOZZA, "Titolo vecchio");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));
        when(utenteRepository.findById(2L)).thenReturn(Optional.of(manager));
        ArticleDraftDTO dto = new ArticleDraftDTO("Titolo nuovo", null, null, null, null);

        gestioneArticoli.updateDraft(10L, 2L, dto);

        assertThat(bozza.getTitolo()).isEqualTo("Titolo nuovo");
    }

    @Test
    void updateDraft_lanciaEccezione_quandoBozzaInesistente() {
        when(articoloRepository.findById(99L)).thenReturn(Optional.empty());
        ArticleDraftDTO dto = new ArticleDraftDTO("Titolo", null, null, null, null);

        assertThrows(ArticoloNonTrovatoException.class, () -> gestioneArticoli.updateDraft(99L, 1L, dto));
    }

    @Test
    void updateDraft_lanciaEccezione_quandoArticoloNonInBozza() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));
        ArticleDraftDTO dto = new ArticleDraftDTO("Titolo nuovo", null, null, null, null);

        assertThrows(StatoArticoloNonValidoException.class, () -> gestioneArticoli.updateDraft(10L, 1L, dto));
    }

    @Test
    void updateDraft_lanciaEccezione_quandoChiamanteNonEProprietarioNeManager() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Utente altroAutore = utente(2L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, null, StatoArticolo.BOZZA, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));
        when(utenteRepository.findById(2L)).thenReturn(Optional.of(altroAutore));
        ArticleDraftDTO dto = new ArticleDraftDTO("Titolo nuovo", null, null, null, null);

        assertThrows(AutoreNonValidoException.class, () -> gestioneArticoli.updateDraft(10L, 2L, dto));
    }

    @Test
    void updateDraft_eliminaLaVecchiaImmagineCopertina_quandoSostituitaConUnaDiversa() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = new Articolo(autore, "Titolo", "Testo", null, "tag", "https://cdn/vecchia-copertina.jpg");
        ReflectionTestUtils.setField(bozza, "id", 10L);
        bozza.setStato(StatoArticolo.BOZZA);
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));
        ArticleDraftDTO dto = new ArticleDraftDTO("Titolo", "Testo", null, null, "https://cdn/nuova-copertina.jpg");

        gestioneArticoli.updateDraft(10L, 1L, dto);

        verify(cloudStorageService).delete("https://cdn/vecchia-copertina.jpg");
    }

    @Test
    void updateDraft_nonEliminaNulla_quandoImmagineCopertinaRestaInvariata() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = new Articolo(autore, "Titolo", "Testo", null, "tag", "https://cdn/stessa-copertina.jpg");
        ReflectionTestUtils.setField(bozza, "id", 10L);
        bozza.setStato(StatoArticolo.BOZZA);
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));
        ArticleDraftDTO dto = new ArticleDraftDTO("Titolo", "Testo", null, null, "https://cdn/stessa-copertina.jpg");

        gestioneArticoli.updateDraft(10L, 1L, dto);

        verify(cloudStorageService, never()).delete(any());
    }

    // --- uploadImmagineCopertina ---------------------------------------------

    @Test
    void uploadImmagineCopertina_valida_eDelegaAlCloudStorageService() {
        MultipartFile file = new MockMultipartFile("file", "copertina.jpg", "image/jpeg", "dati".getBytes());
        when(cloudStorageService.upload(file, "copertine-articoli")).thenReturn("https://cdn/copertina.jpg");

        String url = gestioneArticoli.uploadImmagineCopertina(file);

        verify(imageUploadValidator).validate(file, 5L * 1024 * 1024);
        assertThat(url).isEqualTo("https://cdn/copertina.jpg");
    }

    // --- uploadImmagineCorpoArticolo ------------------------------------------

    @Test
    void uploadImmagineCorpoArticolo_valida_eDelegaAlCloudStorageServiceConCartellaSeparataDallaCopertina() {
        MultipartFile file = new MockMultipartFile("file", "diagramma.jpg", "image/jpeg", "dati".getBytes());
        when(cloudStorageService.upload(file, "immagini-corpo-articoli")).thenReturn("https://cdn/diagramma.jpg");

        String url = gestioneArticoli.uploadImmagineCorpoArticolo(file);

        verify(imageUploadValidator).validate(file, 5L * 1024 * 1024);
        assertThat(url).isEqualTo("https://cdn/diagramma.jpg");
    }

    // --- publishArticle -----------------------------------------------------

    @Test
    void publishArticle_passaAdAttesaApprovazione_quandoBozzaCompleta() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, categoria(5L), StatoArticolo.BOZZA, "Pressione gomme");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));

        gestioneArticoli.publishArticle(10L, 1L);

        assertThat(bozza.getStato()).isEqualTo(StatoArticolo.IN_ATTESA_APPROVAZIONE);
    }

    @Test
    void publishArticle_lanciaEccezione_quandoNonInBozza() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        assertThrows(StatoArticoloNonValidoException.class, () -> gestioneArticoli.publishArticle(10L, 1L));
    }

    @Test
    void publishArticle_lanciaEccezione_quandoTitoloMancante() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, categoria(5L), StatoArticolo.BOZZA, null);
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));

        assertThrows(RegolaDiDominioViolataException.class, () -> gestioneArticoli.publishArticle(10L, 1L));
    }

    @Test
    void publishArticle_lanciaEccezione_quandoCategoriaMancante() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, null, StatoArticolo.BOZZA, "Titolo valido");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));

        assertThrows(RegolaDiDominioViolataException.class, () -> gestioneArticoli.publishArticle(10L, 1L));
    }

    @Test
    void publishArticle_lanciaEccezione_quandoChiamanteNonAutorizzato() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Utente altroAutore = utente(2L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, categoria(5L), StatoArticolo.BOZZA, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));
        when(utenteRepository.findById(2L)).thenReturn(Optional.of(altroAutore));

        assertThrows(AutoreNonValidoException.class, () -> gestioneArticoli.publishArticle(10L, 2L));
    }

    // --- reopenRejectedArticle -----------------------------------------------

    @Test
    void reopenRejectedArticle_riportaInBozza_quandoRifiutato() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo rifiutato = articolo(10L, autore, categoria(5L), StatoArticolo.RIFIUTATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(rifiutato));

        gestioneArticoli.reopenRejectedArticle(10L, 1L);

        assertThat(rifiutato.getStato()).isEqualTo(StatoArticolo.BOZZA);
    }

    @Test
    void reopenRejectedArticle_consentito_quandoChiamanteEManagerAutoriNonProprietario() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Utente manager = utente(2L, Ruolo.MANAGER_AUTORI);
        Articolo rifiutato = articolo(10L, autore, categoria(5L), StatoArticolo.RIFIUTATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(rifiutato));
        when(utenteRepository.findById(2L)).thenReturn(Optional.of(manager));

        gestioneArticoli.reopenRejectedArticle(10L, 2L);

        assertThat(rifiutato.getStato()).isEqualTo(StatoArticolo.BOZZA);
    }

    @Test
    void reopenRejectedArticle_lanciaEccezione_quandoNonRifiutato() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        assertThrows(StatoArticoloNonValidoException.class, () -> gestioneArticoli.reopenRejectedArticle(10L, 1L));
    }

    @Test
    void reopenRejectedArticle_lanciaEccezione_quandoChiamanteNonAutorizzato() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Utente altroAutore = utente(2L, Ruolo.AUTORE);
        Articolo rifiutato = articolo(10L, autore, categoria(5L), StatoArticolo.RIFIUTATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(rifiutato));
        when(utenteRepository.findById(2L)).thenReturn(Optional.of(altroAutore));

        assertThrows(AutoreNonValidoException.class, () -> gestioneArticoli.reopenRejectedArticle(10L, 2L));
    }

    // --- updatePublishedArticle -----------------------------------------------

    @Test
    void updatePublishedArticle_aggiornaTestoERestaPubblicato_quandoArticoloPubblicato() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Categoria categoriaOriginale = categoria(5L);
        Articolo pubblicato = articolo(10L, autore, categoriaOriginale, StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));
        when(categoriaRepository.findById(5L)).thenReturn(Optional.of(categoriaOriginale));
        ArticleUpdateDTO dto = new ArticleUpdateDTO("Titolo corretto", "Testo corretto", 5L, List.of("freni"), null);

        gestioneArticoli.updatePublishedArticle(10L, 1L, dto);

        assertThat(pubblicato.getTesto()).isEqualTo("Testo corretto");
        assertThat(pubblicato.getStato()).isEqualTo(StatoArticolo.PUBBLICATO);
    }

    @Test
    void updatePublishedArticle_lanciaEccezione_quandoNonPubblicato() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, categoria(5L), StatoArticolo.BOZZA, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));
        ArticleUpdateDTO dto = new ArticleUpdateDTO("Titolo", "Testo", 5L, null, null);

        assertThrows(StatoArticoloNonValidoException.class, () -> gestioneArticoli.updatePublishedArticle(10L, 1L, dto));
    }

    @Test
    void updatePublishedArticle_lanciaEccezione_quandoChiamanteNonAutorizzato() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Utente altroAutore = utente(2L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));
        when(utenteRepository.findById(2L)).thenReturn(Optional.of(altroAutore));
        ArticleUpdateDTO dto = new ArticleUpdateDTO("Titolo", "Testo", 5L, null, null);

        assertThrows(AutoreNonValidoException.class, () -> gestioneArticoli.updatePublishedArticle(10L, 2L, dto));
    }

    @Test
    void updatePublishedArticle_eliminaLaVecchiaImmagineCopertina_quandoSostituitaConUnaDiversa() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Categoria categoria = categoria(5L);
        Articolo pubblicato = new Articolo(autore, "Titolo", "Testo", categoria, "tag", "https://cdn/vecchia-copertina.jpg");
        ReflectionTestUtils.setField(pubblicato, "id", 10L);
        pubblicato.setStato(StatoArticolo.PUBBLICATO);
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));
        when(categoriaRepository.findById(5L)).thenReturn(Optional.of(categoria));
        ArticleUpdateDTO dto = new ArticleUpdateDTO("Titolo", "Testo", 5L, null, "https://cdn/nuova-copertina.jpg");

        gestioneArticoli.updatePublishedArticle(10L, 1L, dto);

        verify(cloudStorageService).delete("https://cdn/vecchia-copertina.jpg");
    }

    @Test
    void updatePublishedArticle_nonEliminaNulla_quandoImmagineCopertinaRestaInvariata() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Categoria categoria = categoria(5L);
        Articolo pubblicato = new Articolo(autore, "Titolo", "Testo", categoria, "tag", "https://cdn/stessa-copertina.jpg");
        ReflectionTestUtils.setField(pubblicato, "id", 10L);
        pubblicato.setStato(StatoArticolo.PUBBLICATO);
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));
        when(categoriaRepository.findById(5L)).thenReturn(Optional.of(categoria));
        ArticleUpdateDTO dto = new ArticleUpdateDTO("Titolo", "Testo", 5L, null, "https://cdn/stessa-copertina.jpg");

        gestioneArticoli.updatePublishedArticle(10L, 1L, dto);

        verify(cloudStorageService, never()).delete(any());
    }

    // --- deleteDraft -----------------------------------------------------

    @Test
    void deleteDraft_eliminaBozza_quandoStatoBozzaEProprietario() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, null, StatoArticolo.BOZZA, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));

        gestioneArticoli.deleteDraft(10L, 1L);

        verify(articoloRepository).delete(bozza);
    }

    @Test
    void deleteDraft_lanciaEccezione_quandoNonInBozza() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        assertThrows(StatoArticoloNonValidoException.class, () -> gestioneArticoli.deleteDraft(10L, 1L));
        verify(articoloRepository, never()).delete(any());
    }

    // --- deleteArticle -----------------------------------------------------

    @Test
    void deleteArticle_eliminaArticolo_quandoPubblicato() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        gestioneArticoli.deleteArticle(10L, 1L);

        verify(articoloSalvatoRepository).deleteByArticoloId(10L);
        verify(visualizzazioneArticoloRepository).deleteByArticoloId(10L);
        verify(articoloRepository).delete(pubblicato);
    }

    @Test
    void deleteArticle_eliminaArticolo_quandoInAttesaApprovazione() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo inAttesa = articolo(10L, autore, categoria(5L), StatoArticolo.IN_ATTESA_APPROVAZIONE, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(inAttesa));

        gestioneArticoli.deleteArticle(10L, 1L);

        verify(articoloSalvatoRepository).deleteByArticoloId(10L);
        verify(visualizzazioneArticoloRepository).deleteByArticoloId(10L);
        verify(articoloRepository).delete(inAttesa);
    }

    @Test
    void deleteArticle_eliminaArticolo_quandoRifiutato() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo rifiutato = articolo(10L, autore, categoria(5L), StatoArticolo.RIFIUTATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(rifiutato));

        gestioneArticoli.deleteArticle(10L, 1L);

        verify(articoloSalvatoRepository).deleteByArticoloId(10L);
        verify(visualizzazioneArticoloRepository).deleteByArticoloId(10L);
        verify(articoloRepository).delete(rifiutato);
    }

    @Test
    void deleteArticle_lanciaEccezione_quandoInBozza() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, null, StatoArticolo.BOZZA, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));

        assertThrows(StatoArticoloNonValidoException.class, () -> gestioneArticoli.deleteArticle(10L, 1L));
        verify(articoloRepository, never()).delete(any());
    }

    // --- saveArticleToList -----------------------------------------------------

    @Test
    void saveArticleToList_salvaArticolo_quandoNonGiaPresenteNellaLista() {
        Utente utente = utente(1L, Ruolo.ISCRITTO);
        Articolo pubblicato = articolo(10L, utente(2L, Ruolo.AUTORE), categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloSalvatoRepository.existsByUtenteIdAndArticoloIdAndTipoLista(1L, 10L, TipoLista.PREFERITI)).thenReturn(false);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        gestioneArticoli.saveArticleToList(1L, 10L, TipoLista.PREFERITI);

        ArgumentCaptor<ArticoloSalvato> captor = ArgumentCaptor.forClass(ArticoloSalvato.class);
        verify(articoloSalvatoRepository).save(captor.capture());
        assertThat(captor.getValue().getTipoLista()).isEqualTo(TipoLista.PREFERITI);
    }

    @Test
    void saveArticleToList_lanciaEccezione_quandoGiaPresenteNellaLista() {
        when(articoloSalvatoRepository.existsByUtenteIdAndArticoloIdAndTipoLista(1L, 10L, TipoLista.PREFERITI)).thenReturn(true);

        assertThrows(ArticoloGiaSalvatoException.class,
                () -> gestioneArticoli.saveArticleToList(1L, 10L, TipoLista.PREFERITI));
        verify(articoloSalvatoRepository, never()).save(any());
    }

    @Test
    void saveArticleToList_lanciaEccezione_quandoArticoloNonPubblicato() {
        Utente utente = utente(1L, Ruolo.ISCRITTO);
        Articolo bozza = articolo(10L, utente(2L, Ruolo.AUTORE), null, StatoArticolo.BOZZA, "Titolo");
        when(articoloSalvatoRepository.existsByUtenteIdAndArticoloIdAndTipoLista(1L, 10L, TipoLista.PREFERITI)).thenReturn(false);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));

        assertThrows(StatoArticoloNonValidoException.class,
                () -> gestioneArticoli.saveArticleToList(1L, 10L, TipoLista.PREFERITI));
        verify(articoloSalvatoRepository, never()).save(any());
    }

    // --- removeArticleFromList -----------------------------------------------------

    @Test
    void removeArticleFromList_rimuoveArticolo_quandoPresenteNellaLista() {
        ArticoloSalvato salvato = new ArticoloSalvato(utente(1L, Ruolo.ISCRITTO),
                articolo(10L, utente(2L, Ruolo.AUTORE), categoria(5L), StatoArticolo.PUBBLICATO, "Titolo"),
                TipoLista.LEGGI_PIU_TARDI);
        when(articoloSalvatoRepository.findByUtenteIdAndArticoloIdAndTipoLista(1L, 10L, TipoLista.LEGGI_PIU_TARDI))
                .thenReturn(Optional.of(salvato));

        gestioneArticoli.removeArticleFromList(1L, 10L, TipoLista.LEGGI_PIU_TARDI);

        verify(articoloSalvatoRepository).delete(salvato);
    }

    @Test
    void removeArticleFromList_lanciaEccezione_quandoNonPresenteNellaLista() {
        when(articoloSalvatoRepository.findByUtenteIdAndArticoloIdAndTipoLista(1L, 10L, TipoLista.PREFERITI))
                .thenReturn(Optional.empty());

        assertThrows(ArticoloNonSalvatoException.class,
                () -> gestioneArticoli.removeArticleFromList(1L, 10L, TipoLista.PREFERITI));
        verify(articoloSalvatoRepository, never()).delete(any());
    }

    // --- query: getArticleById -----------------------------------------------------

    @Test
    void getArticleById_restituisceDettaglioEIncrementaVisualizzazioni_quandoLettorePubblico() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Dischi freno forati vs baffati");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        ArticleDetailDTO dettaglio = gestioneArticoli.getArticleById(10L, null);

        assertThat(dettaglio.titolo()).isEqualTo("Dischi freno forati vs baffati");
        assertThat(dettaglio.tag()).containsExactly("freni", "manutenzione");
        assertThat(pubblicato.getNumeroVisualizzazioni()).isEqualTo(1L);
        verify(visualizzazioneArticoloRepository).save(any(VisualizzazioneArticolo.class));
    }

    @Test
    void getArticleById_popolaCatenaAntenatiCategoria_delegandoAGestioneCategorie() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));
        List<CategoryAncestorDTO> catena = List.of(
                new CategoryAncestorDTO(1L, "Manutenzione ordinaria"),
                new CategoryAncestorDTO(3L, "Impianto Frenante"),
                new CategoryAncestorDTO(5L, "Dischi Freno Forati"));
        when(gestioneCategorie.getCategoryPath(5L)).thenReturn(catena);

        ArticleDetailDTO dettaglio = gestioneArticoli.getArticleById(10L, null);

        assertThat(dettaglio.categoriaAntenati()).containsExactlyElementsOf(catena);
    }

    @Test
    void getArticleById_catenaAntenatiVuota_quandoArticoloSenzaCategoria() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, null, StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        ArticleDetailDTO dettaglio = gestioneArticoli.getArticleById(10L, null);

        assertThat(dettaglio.categoriaAntenati()).isEmpty();
        verify(gestioneCategorie, never()).getCategoryPath(any());
    }

    @Test
    void getArticleById_incrementaVisualizzazioni_quandoLettoreIscritto() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        gestioneArticoli.getArticleById(10L, Ruolo.ISCRITTO);

        assertThat(pubblicato.getNumeroVisualizzazioni()).isEqualTo(1L);
        verify(visualizzazioneArticoloRepository).save(any(VisualizzazioneArticolo.class));
    }

    @Test
    void getArticleById_nonIncrementaVisualizzazioni_quandoAutoreSuArticoloAltrui() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        // callerRuolo = AUTORE, ma non e' l'autore di QUESTO articolo (autore.id = 1L): non deve
        // comunque incrementare, perche' la restrizione e' sul ruolo, non sull'ownership.
        gestioneArticoli.getArticleById(10L, Ruolo.AUTORE);

        assertThat(pubblicato.getNumeroVisualizzazioni()).isZero();
        verify(visualizzazioneArticoloRepository, never()).save(any());
    }

    @Test
    void getArticleById_nonIncrementaVisualizzazioni_quandoChiamanteEAutoreDellArticolo() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        gestioneArticoli.getArticleById(10L, Ruolo.AUTORE);
        gestioneArticoli.getArticleById(10L, Ruolo.AUTORE);
        gestioneArticoli.getArticleById(10L, Ruolo.AUTORE);

        assertThat(pubblicato.getNumeroVisualizzazioni()).isZero();
        verify(visualizzazioneArticoloRepository, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(value = Ruolo.class, names = {"AUTORE", "MANAGER_AUTORI", "GESTORE_UTENTI"})
    void getArticleById_nonIncrementaVisualizzazioni_perNessunRuoloRedazionale(Ruolo ruoloRedazionale) {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        gestioneArticoli.getArticleById(10L, ruoloRedazionale);

        assertThat(pubblicato.getNumeroVisualizzazioni()).isZero();
        verify(visualizzazioneArticoloRepository, never()).save(any());
    }

    @Test
    void getArticleById_lanciaEccezione_quandoInesistente() {
        when(articoloRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ArticoloNonTrovatoException.class, () -> gestioneArticoli.getArticleById(99L, null));
    }

    // --- query: getArticlesByAuthor -----------------------------------------------------

    @Test
    void getArticlesByAuthor_restituisceTuttiGliArticoliDellAutore() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, null, StatoArticolo.BOZZA, "Bozza");
        Articolo pubblicato = articolo(11L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Pubblicato");
        when(articoloRepository.findByAutoreIdOrderByDataUltimoAggiornamentoDesc(1L))
                .thenReturn(List.of(pubblicato, bozza));
        when(articoloSalvatoRepository.countByArticoloIdIn(any())).thenReturn(List.of());

        List<AuthorArticleSummaryDTO> risultato = gestioneArticoli.getArticlesByAuthor(1L);

        assertThat(risultato).hasSize(2);
        assertThat(risultato).extracting(dto -> dto.articolo().stato())
                .containsExactly(StatoArticolo.PUBBLICATO, StatoArticolo.BOZZA);
    }

    @Test
    void getArticlesByAuthor_calcolaNumeroSalvataggiConUnaSolaQueryAggregata() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(11L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Pubblicato");
        when(articoloRepository.findByAutoreIdOrderByDataUltimoAggiornamentoDesc(1L)).thenReturn(List.of(pubblicato));
        ConteggioSalvataggiPerArticolo conteggio = mock(ConteggioSalvataggiPerArticolo.class);
        when(conteggio.getArticoloId()).thenReturn(11L);
        when(conteggio.getConteggio()).thenReturn(3L);
        when(articoloSalvatoRepository.countByArticoloIdIn(List.of(11L))).thenReturn(List.of(conteggio));

        List<AuthorArticleSummaryDTO> risultato = gestioneArticoli.getArticlesByAuthor(1L);

        assertThat(risultato).hasSize(1);
        assertThat(risultato.get(0).numeroSalvataggi()).isEqualTo(3L);
    }

    @Test
    void getArticlesByAuthor_restituisceZeroSalvataggi_quandoLArticoloNonEMaiStatoSalvato() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(11L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Pubblicato");
        when(articoloRepository.findByAutoreIdOrderByDataUltimoAggiornamentoDesc(1L)).thenReturn(List.of(pubblicato));
        when(articoloSalvatoRepository.countByArticoloIdIn(List.of(11L))).thenReturn(List.of());

        List<AuthorArticleSummaryDTO> risultato = gestioneArticoli.getArticlesByAuthor(1L);

        assertThat(risultato.get(0).numeroSalvataggi()).isZero();
    }

    // --- query: getSavedArticles -----------------------------------------------------

    @Test
    void getSavedArticles_restituisceListaConTipoAssociato() {
        Utente iscritto = utente(1L, Ruolo.ISCRITTO);
        Articolo pubblicato = articolo(10L, utente(2L, Ruolo.AUTORE), categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        ArticoloSalvato salvato = new ArticoloSalvato(iscritto, pubblicato, TipoLista.PREFERITI);
        when(articoloSalvatoRepository.findByUtenteIdOrderByDataSalvataggioDesc(1L)).thenReturn(List.of(salvato));

        List<SavedArticleDTO> risultato = gestioneArticoli.getSavedArticles(1L);

        assertThat(risultato).hasSize(1);
        assertThat(risultato.get(0).tipoLista()).isEqualTo(TipoLista.PREFERITI);
        assertThat(risultato.get(0).articolo().id()).isEqualTo(10L);
    }

    // --- query: searchArticles -----------------------------------------------------

    @Test
    void searchArticles_deleganAlRepositoryConDefaultDiPaginazione() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO, "Titolo");
        Page<Articolo> pagina = new PageImpl<>(List.of(pubblicato));
        when(articoloRepository.cercaPubblicati(isNull(), isNull(), any())).thenReturn(pagina);

        var risultato = gestioneArticoli.searchArticles(new SearchCriteriaDTO(null, null, null, null, null, null));

        assertThat(risultato.articoli()).hasSize(1);
        assertThat(risultato.totaleRisultati()).isEqualTo(1);
        assertThat(risultato.pagina()).isZero();
    }

    @Test
    void searchArticles_passaQueryECategorieAlRepository() {
        // 5L e 6L senza sottocategorie (findAll non stubbato = lista vuota): l'espansione
        // restituisce esattamente gli id richiesti, nello stesso ordine di inserimento.
        Page<Articolo> paginaVuota = new PageImpl<>(List.of());
        when(articoloRepository.cercaPubblicati(eq("freni"), eq(new Long[]{5L, 6L}), any())).thenReturn(paginaVuota);

        gestioneArticoli.searchArticles(new SearchCriteriaDTO("freni", List.of(5L, 6L), 1, 10, null, null));

        verify(articoloRepository).cercaPubblicati(eq("freni"), eq(new Long[]{5L, 6L}), any());
    }

    @Test
    void searchArticles_includeLeSottocategorie_quandoFiltraPerCategoriaPadre() {
        // RF1.2 ("Categoria e relative sottocategorie") + mockup 02_esplora_articoli.png: filtrare
        // per "Manutenzione Ordinaria" (id 1) deve includere anche i suoi figli diretti e indiretti.
        Categoria radice = categoria(1L);
        Categoria figlia = new Categoria("Impianto Frenante", "desc", radice);
        ReflectionTestUtils.setField(figlia, "id", 2L);
        Categoria nipote = new Categoria("Pastiglie", "desc", figlia);
        ReflectionTestUtils.setField(nipote, "id", 3L);
        Categoria categoriaNonImparentata = categoria(9L);
        when(categoriaRepository.findAll()).thenReturn(List.of(radice, figlia, nipote, categoriaNonImparentata));

        Page<Articolo> paginaVuota = new PageImpl<>(List.of());
        ArgumentCaptor<Long[]> categoriaIdsCaptor = ArgumentCaptor.forClass(Long[].class);
        when(articoloRepository.cercaPubblicati(isNull(), categoriaIdsCaptor.capture(), any())).thenReturn(paginaVuota);

        gestioneArticoli.searchArticles(new SearchCriteriaDTO(null, List.of(1L), null, null, null, null));

        assertThat(categoriaIdsCaptor.getValue()).containsExactlyInAnyOrder(1L, 2L, 3L);
    }

    @Test
    void searchArticles_nonIncludeLeSottocategorie_quandoEspandiSottocategorieEFalse() {
        // Stessa gerarchia radice(1)->figlia(2)->nipote(3) del test sopra (TC11.2), ma qui
        // espandiSottocategorie=false (drill-down di Esplora): il match deve restare esatto sulla
        // sola radice, ignorando figlia e nipote anche se hanno articoli propri - comportamento
        // distinto e non una regressione di TC11.2. Nessuno stub su categoriaRepository.findAll():
        // con l'espansione disattivata non deve nemmeno essere invocato (verificato sotto), uno
        // stub qui sarebbe morto e Mockito lo segnalerebbe come UnnecessaryStubbingException.
        Page<Articolo> paginaVuota = new PageImpl<>(List.of());
        ArgumentCaptor<Long[]> categoriaIdsCaptor = ArgumentCaptor.forClass(Long[].class);
        when(articoloRepository.cercaPubblicati(isNull(), categoriaIdsCaptor.capture(), any())).thenReturn(paginaVuota);

        gestioneArticoli.searchArticles(new SearchCriteriaDTO(null, List.of(1L), null, null, null, false));

        assertThat(categoriaIdsCaptor.getValue()).containsExactly(1L);
        verify(categoriaRepository, org.mockito.Mockito.never()).findAll();
    }
}
