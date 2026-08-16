package com.motormindhub.Api.service.gestioneArticoli;

import com.motormindhub.Api.model.entity.Articolo;
import com.motormindhub.Api.model.entity.ArticoloSalvato;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoArticolo;
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
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleSearchResultDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleSummaryDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.ArticleUpdateDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.AuthorArticleSummaryDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.OrdinamentoArticoli;
import com.motormindhub.Api.service.gestioneArticoli.dto.SavedArticleDTO;
import com.motormindhub.Api.service.gestioneArticoli.dto.SearchCriteriaDTO;
import com.motormindhub.Api.service.gestioneArticoli.exception.ArticoloGiaSalvatoException;
import com.motormindhub.Api.service.gestioneArticoli.exception.ArticoloNonSalvatoException;
import com.motormindhub.Api.service.gestioneArticoli.exception.ArticoloNonTrovatoException;
import com.motormindhub.Api.service.gestioneArticoli.exception.AutoreNonValidoException;
import com.motormindhub.Api.service.gestioneArticoli.exception.CategoriaNonTrovataException;
import com.motormindhub.Api.service.gestioneArticoli.exception.RegolaDiDominioViolataException;
import com.motormindhub.Api.service.gestioneArticoli.exception.StatoArticoloNonValidoException;
import com.motormindhub.Api.service.gestioneArticoli.exception.UtenteNonTrovatoException;
import com.motormindhub.Api.service.storage.CloudStorageService;
import com.motormindhub.Api.service.storage.ImageUploadValidator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Deque;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Facade del sottosistema GestioneArticoli (SDD 3.1, ODD 2.2): creazione, modifica, bozze,
 * pubblicazione, ricerca/filtri e liste personali (Preferiti/Leggi più tardi).
 */
@Service
public class GestioneArticoli {

    private static final int PAGINA_DEFAULT = 0;
    private static final int DIMENSIONE_PAGINA_DEFAULT = 20;
    private static final int PAROLE_AL_MINUTO = 200;
    private static final int LUNGHEZZA_ESTRATTO = 160;

    // Upload immagini articolo (copertina o inline nel corpo Markdown, SDD 3.2): limite piu'
    // permissivo della foto profilo (GestioneUtenti) perche' sono immagini hero/di contenuto, non
    // un piccolo avatar. Stesso limite per entrambi gli usi, non solo la stessa validazione.
    private static final long MAX_DIMENSIONE_IMMAGINE_ARTICOLO_BYTES = 5L * 1024 * 1024;
    private static final String CARTELLA_IMMAGINI_COPERTINA = "copertine-articoli";
    // Cartella separata da CARTELLA_IMMAGINI_COPERTINA: tiene distinte nel media library del
    // provider le immagini di copertina da quelle incollate inline nel corpo dell'articolo.
    private static final String CARTELLA_IMMAGINI_CORPO_ARTICOLO = "immagini-corpo-articoli";

    private final ArticoloRepository articoloRepository;
    private final ArticoloSalvatoRepository articoloSalvatoRepository;
    private final CategoriaRepository categoriaRepository;
    private final UtenteRepository utenteRepository;
    private final VisualizzazioneArticoloRepository visualizzazioneArticoloRepository;
    private final CloudStorageService cloudStorageService;
    private final ImageUploadValidator imageUploadValidator;

    public GestioneArticoli(ArticoloRepository articoloRepository,
                             ArticoloSalvatoRepository articoloSalvatoRepository,
                             CategoriaRepository categoriaRepository,
                             UtenteRepository utenteRepository,
                             VisualizzazioneArticoloRepository visualizzazioneArticoloRepository,
                             CloudStorageService cloudStorageService,
                             ImageUploadValidator imageUploadValidator) {
        this.articoloRepository = articoloRepository;
        this.articoloSalvatoRepository = articoloSalvatoRepository;
        this.categoriaRepository = categoriaRepository;
        this.utenteRepository = utenteRepository;
        this.visualizzazioneArticoloRepository = visualizzazioneArticoloRepository;
        this.cloudStorageService = cloudStorageService;
        this.imageUploadValidator = imageUploadValidator;
    }

    /**
     * pre: file valido (formato JPEG/PNG/WEBP, dimensione <= 5MB, contenuto verificato come
     * immagine reale - ImageUploadValidator)
     * post: il file e' caricato su Cloud Storage e viene restituito il suo URL pubblico. Non lega
     * l'upload a un articolo/bozza esistente: l'editor supporta un articolo non ancora creato
     * (nessun id), quindi il chiamante deve poi passare l'URL a createDraft/updateDraft/
     * updatePublishedArticle per persisterlo (ODD 2.2).
     * (SDD 3.2)
     */
    public String uploadImmagineCopertina(MultipartFile file) {
        imageUploadValidator.validate(file, MAX_DIMENSIONE_IMMAGINE_ARTICOLO_BYTES);
        return cloudStorageService.upload(file, CARTELLA_IMMAGINI_COPERTINA);
    }

    /**
     * pre: file valido (formato JPEG/PNG/WEBP, dimensione <= 5MB, contenuto verificato come
     * immagine reale - ImageUploadValidator, stessa validazione di uploadImmagineCopertina)
     * post: il file e' caricato su Cloud Storage in una cartella separata dalla copertina
     * (CARTELLA_IMMAGINI_CORPO_ARTICOLO) e viene restituito il suo URL pubblico. Non tocca
     * Articolo: il client incolla l'URL come immagine inline nel Markdown di dto.testo e lo
     * persiste passando l'intero testo a createDraft/updateDraft/updatePublishedArticle - stesso
     * pattern di uploadImmagineCopertina, nessuno stato nuovo lato backend.
     * (SDD 3.2)
     */
    public String uploadImmagineCorpoArticolo(MultipartFile file) {
        imageUploadValidator.validate(file, MAX_DIMENSIONE_IMMAGINE_ARTICOLO_BYTES);
        return cloudStorageService.upload(file, CARTELLA_IMMAGINI_CORPO_ARTICOLO);
    }

    /**
     * pre: exists u | u.id = authorId and (u.ruolo = AUTORE or u.ruolo = MANAGER_AUTORI)
     * post: exists a | a.autore.id = authorId and a.stato = BOZZA
     * (ODD 2.2, RF2.7, UC_16)
     */
    @Transactional
    public Long createDraft(Long authorId, ArticleDraftDTO dto) {
        Utente autore = utenteRepository.findById(authorId)
                .filter(u -> u.getRuolo() == Ruolo.AUTORE || u.getRuolo() == Ruolo.MANAGER_AUTORI)
                .orElseThrow(() -> new AutoreNonValidoException("Solo autori e manager possono creare articoli."));

        Categoria categoria = risolviCategoria(dto.categoriaId());
        Articolo articolo = new Articolo(autore, dto.titolo(), dto.testo(), categoria, unisciTag(dto.tag()), dto.immagineCopertina());
        articolo = articoloRepository.save(articolo);
        return articolo.getId();
    }

    /**
     * pre: exists a | a.id = draftId and a.stato = BOZZA
     * post: a.titolo = dto.titolo
     * (ODD 2.2, RF2.7, UC_17)
     *
     * Se immagineCopertina cambia rispetto al valore precedente, il vecchio file viene eliminato da
     * Cloud Storage (best-effort, cfr. CloudStorageService.delete) per non accumulare asset orfani
     * a ogni sostituzione della copertina.
     */
    @Transactional
    public void updateDraft(Long draftId, Long callerId, ArticleDraftDTO dto) {
        Articolo bozza = trovaBozzaDiProprietaOLancia(draftId, callerId);

        Categoria categoria = risolviCategoria(dto.categoriaId());
        String vecchiaImmagineCopertina = bozza.getImmagineCopertina();
        bozza.aggiornaContenuto(dto.titolo(), dto.testo(), categoria, unisciTag(dto.tag()), dto.immagineCopertina());

        if (vecchiaImmagineCopertina != null && !Objects.equals(vecchiaImmagineCopertina, dto.immagineCopertina())) {
            cloudStorageService.delete(vecchiaImmagineCopertina);
        }
    }

    /**
     * pre: exists a | a.id = articleId and a.stato = BOZZA and not a.titolo.oclIsUndefined()
     *      and not a.categoria.oclIsUndefined()
     * post: a.stato = IN_ATTESA_APPROVAZIONE
     * (ODD 2.2, RF2.2, UC_15, UC_17)
     */
    @Transactional
    public void publishArticle(Long articleId, Long callerId) {
        Articolo articolo = trovaArticoloOLancia(articleId);
        verificaAutoreOManager(articolo, callerId);

        if (articolo.getStato() != StatoArticolo.BOZZA) {
            throw new StatoArticoloNonValidoException("Solo una bozza puo' essere inviata in approvazione.");
        }
        if (articolo.getTitolo() == null || articolo.getTitolo().isBlank()) {
            throw new RegolaDiDominioViolataException("Il titolo e' obbligatorio prima di pubblicare l'articolo.");
        }
        if (articolo.getCategoria() == null) {
            throw new RegolaDiDominioViolataException("La categoria e' obbligatoria prima di pubblicare l'articolo.");
        }

        articolo.setStato(StatoArticolo.IN_ATTESA_APPROVAZIONE);
    }

    /**
     * pre: exists a | a.id = articleId and a.stato = PUBBLICATO
     * post: a.testo = dto.testo  and  a.stato resta PUBBLICATO
     * (ODD 2.2, RF2.3, UC_20)
     *
     * Se immagineCopertina cambia rispetto al valore precedente, il vecchio file viene eliminato da
     * Cloud Storage (best-effort, cfr. CloudStorageService.delete) per non accumulare asset orfani
     * a ogni sostituzione della copertina.
     */
    @Transactional
    public void updatePublishedArticle(Long articleId, Long callerId, ArticleUpdateDTO dto) {
        Articolo articolo = trovaArticoloOLancia(articleId);
        verificaAutoreOManager(articolo, callerId);

        if (articolo.getStato() != StatoArticolo.PUBBLICATO) {
            throw new StatoArticoloNonValidoException("Solo un articolo pubblicato puo' essere corretto con questa operazione.");
        }

        Categoria categoria = categoriaRepository.findById(dto.categoriaId())
                .orElseThrow(() -> new CategoriaNonTrovataException("Categoria non trovata."));
        String vecchiaImmagineCopertina = articolo.getImmagineCopertina();
        articolo.aggiornaContenuto(dto.titolo(), dto.testo(), categoria, unisciTag(dto.tag()), dto.immagineCopertina());
        // stato invariato = PUBBLICATO: aggiornaContenuto non tocca il campo stato.

        if (vecchiaImmagineCopertina != null && !Objects.equals(vecchiaImmagineCopertina, dto.immagineCopertina())) {
            cloudStorageService.delete(vecchiaImmagineCopertina);
        }
    }

    /**
     * pre: exists a | a.id = articleId and a.stato = RIFIUTATO
     * post: a.stato = BOZZA
     * (ODD 2.2, RF2.7, UC_18, UC_21)
     */
    @Transactional
    public void reopenRejectedArticle(Long articleId, Long callerId) {
        Articolo articolo = trovaArticoloOLancia(articleId);
        verificaAutoreOManager(articolo, callerId);

        if (articolo.getStato() != StatoArticolo.RIFIUTATO) {
            throw new StatoArticoloNonValidoException("Solo un articolo rifiutato puo' tornare in stato di bozza.");
        }

        articolo.riapriComeBozza();
    }

    /**
     * pre: exists a | a.id = draftId and a.stato = BOZZA
     * post: not exists a | a.id = draftId
     * (ODD 2.2, RF2.7, UC_18)
     */
    @Transactional
    public void deleteDraft(Long draftId, Long callerId) {
        Articolo bozza = trovaBozzaDiProprietaOLancia(draftId, callerId);
        articoloRepository.delete(bozza);
    }

    /**
     * pre: exists a | a.id = articleId and a.stato != BOZZA
     * post: not exists a | a.id = articleId
     * and not exists s | s.articolo.id = articleId
     * (ODD 2.2, RF2.4, RF2.7, UC_18, UC_19, UC_21)
     */
    @Transactional
    public void deleteArticle(Long articleId, Long callerId) {
        Articolo articolo = trovaArticoloOLancia(articleId);
        verificaAutoreOManager(articolo, callerId);

        if (articolo.getStato() == StatoArticolo.BOZZA) {
            throw new StatoArticoloNonValidoException("Una bozza si elimina con l'operazione dedicata (deleteDraft).");
        }
        // Rimozione esplicita dei salvataggi (RF1.7/RF1.8) e del log letture (ODD 2.4 andamentoLetture)
        // prima della cancellazione dell'articolo: ne' articoli_salvati.articolo_id ne'
        // visualizzazioni_articolo.articolo_id hanno ON DELETE CASCADE (vincolo di integrita'
        // referenziale deliberatamente nudo, coerente con l'approccio del progetto per le
        // cancellazioni con effetti a cascata - vedi CategoriaEliminataListener - esplicito e
        // tracciabile a livello applicativo invece che implicito nello schema).
        articoloSalvatoRepository.deleteByArticoloId(articleId);
        visualizzazioneArticoloRepository.deleteByArticoloId(articleId);
        articoloRepository.delete(articolo);
    }

    /**
     * pre: not exists s | s.utente.id = userId and s.articolo.id = articleId and s.tipoLista = tipo
     * and exists a | a.id = articleId and a.stato = StatoArticolo::PUBBLICATO
     * post: exists s | s.utente.id = userId and s.articolo.id = articleId and s.tipoLista = tipo
     * (ODD 2.2, RF1.7, UC_6)
     */
    @Transactional
    public void saveArticleToList(Long userId, Long articleId, TipoLista tipo) {
        if (articoloSalvatoRepository.existsByUtenteIdAndArticoloIdAndTipoLista(userId, articleId, tipo)) {
            throw new ArticoloGiaSalvatoException("Articolo gia' presente in questa lista.");
        }

        Utente utente = utenteRepository.findById(userId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente non trovato."));
        Articolo articolo = trovaArticoloOLancia(articleId);
        // RF1.2/RF1.7: solo articoli PUBBLICATO sono visibili/navigabili dall'Iscritto - una bozza o
        // un articolo in attesa di approvazione non dovrebbe essere raggiungibile in primo luogo.
        // Rifiutare esplicitamente qui (invece di limitarsi a ripulire articoli_salvati quando poi
        // l'autore cancella la bozza, cfr. deleteArticle) impedisce il problema alla radice: un
        // salvataggio "orfano" non arriva mai a esistere.
        if (articolo.getStato() != StatoArticolo.PUBBLICATO) {
            throw new StatoArticoloNonValidoException("Solo un articolo pubblicato puo' essere salvato in una lista personale.");
        }

        articoloSalvatoRepository.save(new ArticoloSalvato(utente, articolo, tipo));
    }

    /**
     * pre: exists s | s.utente.id = userId and s.articolo.id = articleId and s.tipoLista = tipo
     * post: not exists s | s.utente.id = userId and s.articolo.id = articleId and s.tipoLista = tipo
     * (ODD 2.2, RF1.7, UC_7)
     */
    @Transactional
    public void removeArticleFromList(Long userId, Long articleId, TipoLista tipo) {
        ArticoloSalvato salvato = articoloSalvatoRepository.findByUtenteIdAndArticoloIdAndTipoLista(userId, articleId, tipo)
                .orElseThrow(() -> new ArticoloNonSalvatoException("L'articolo non risulta salvato in questa lista."));
        articoloSalvatoRepository.delete(salvato);
    }

    /**
     * Query di sola lettura (RF1.2) - nessun contratto OCL formale. RF1.2 richiede filtri "per
     * Categoria e relative sottocategorie" (mockup 02_esplora_articoli.png: dropdown categoria +
     * checkbox "Componente" sulle sue sottocategorie dirette): selezionare una categoria padre deve
     * includere anche gli articoli delle sue sottocategorie, non solo il match esatto sull'id. La
     * risoluzione dell'albero e' quindi responsabilita' del service, non del chiamante.
     */
    @Transactional(readOnly = true)
    public ArticleSearchResultDTO searchArticles(SearchCriteriaDTO criteria) {
        int pagina = Optional.ofNullable(criteria.pagina()).filter(p -> p >= 0).orElse(PAGINA_DEFAULT);
        int dimensionePagina = Optional.ofNullable(criteria.dimensionePagina()).filter(d -> d > 0).orElse(DIMENSIONE_PAGINA_DEFAULT);
        OrdinamentoArticoli ordinamento = Optional.ofNullable(criteria.ordinamento()).orElse(OrdinamentoArticoli.PIU_RECENTI);
        String query = (criteria.query() == null || criteria.query().isBlank()) ? null : criteria.query();
        List<Long> categoriaIds = espandiConSottocategorie(criteria.categoriaIds());
        Long[] categoriaIdsArray = categoriaIds == null ? null : categoriaIds.toArray(new Long[0]);

        Pageable pageable = PageRequest.of(pagina, dimensionePagina, risolviOrdinamento(ordinamento));
        Page<Articolo> risultati = articoloRepository.cercaPubblicati(query, categoriaIdsArray, pageable);

        List<ArticleSummaryDTO> articoli = risultati.getContent().stream().map(this::mappaSummary).toList();
        return new ArticleSearchResultDTO(articoli, risultati.getTotalElements(), pagina, dimensionePagina);
    }

    /**
     * Query di sola lettura (RF1.1) - nessun contratto OCL formale. Incrementa il contatore
     * "letture" mostrato nel mockup 22_autore_articoli.png solo per un pubblico di lettori reali
     * (Guest o Iscritto): mai per un ruolo redazionale (Autore, Manager Autori, Gestore Utenti),
     * a prescindere che l'articolo sia proprio o altrui - altrimenti le riletture in fase di
     * editing/revisione/moderazione gonfierebbero "Letture totali" nella Dashboard Autore e
     * l'ordinamento "Più lette" in Esplora. Un controllo basato solo sull'ownership (come in una
     * versione precedente di questo metodo) non basta: un Autore che legge l'articolo di un
     * collega, o un Manager/Gestore che lo apre per moderarlo, non e' un lettore e non deve
     * incrementare il contatore. callerRuolo e' null per un chiamante non autenticato (Guest), che
     * incrementa sempre normalmente. Nella stessa condizione, stessa transazione, viene anche
     * loggata una VisualizzazioneArticolo (ODD 2.4 andamentoLetture): scrittura sincrona, non un
     * evento @Async come GestioneNotifiche - un INSERT locale indicizzato non e' la chiamata di rete
     * lenta/inaffidabile per cui AsyncConfig esiste, e restare nella stessa transazione garantisce
     * che contatore e log restino sempre allineati (si committano o si rollbackano insieme).
     */
    @Transactional
    public ArticleDetailDTO getArticleById(Long articleId, Ruolo callerRuolo) {
        Articolo articolo = trovaArticoloOLancia(articleId);
        if (callerRuolo == null || callerRuolo == Ruolo.ISCRITTO) {
            articolo.incrementaVisualizzazioni();
            visualizzazioneArticoloRepository.save(new VisualizzazioneArticolo(articolo));
        }
        return mappaDettaglio(articolo);
    }

    /**
     * Query di sola lettura (RF2.1) - nessun contratto OCL formale. numeroSalvataggi e' calcolato
     * con un'unica query aggregata (ArticoloSalvatoRepository.countByArticoloIdIn, GROUP BY), non
     * una countByArticoloId per articolo dentro il .map() - stesso pattern anti-N+1 di
     * GestioneAutori.listAuthors. Bozze/rifiutati non sono mai stati raggiungibili pubblicamente,
     * quindi non hanno mai potuto essere salvati: 0 senza alcuna gestione speciale.
     */
    @Transactional(readOnly = true)
    public List<AuthorArticleSummaryDTO> getArticlesByAuthor(Long authorId) {
        List<Articolo> articoli = articoloRepository.findByAutoreIdOrderByDataUltimoAggiornamentoDesc(authorId);
        List<Long> articoloIds = articoli.stream().map(Articolo::getId).toList();
        Map<Long, Long> conteggiSalvataggi = articoloIds.isEmpty()
                ? Map.of()
                : articoloSalvatoRepository.countByArticoloIdIn(articoloIds).stream()
                        .collect(Collectors.toMap(ConteggioSalvataggiPerArticolo::getArticoloId, ConteggioSalvataggiPerArticolo::getConteggio));

        return articoli.stream()
                .map(a -> new AuthorArticleSummaryDTO(mappaSummary(a), conteggiSalvataggi.getOrDefault(a.getId(), 0L)))
                .toList();
    }

    /** Query di sola lettura (RF1.8, UC_7) - nessun contratto OCL formale. */
    @Transactional(readOnly = true)
    public List<SavedArticleDTO> getSavedArticles(Long userId) {
        return articoloSalvatoRepository.findByUtenteIdOrderByDataSalvataggioDesc(userId).stream()
                .map(s -> new SavedArticleDTO(mappaSummary(s.getArticolo()), s.getTipoLista(),
                        DateTimeFormatter.ISO_INSTANT.format(s.getDataSalvataggio())))
                .toList();
    }

    // --- helper privati -----------------------------------------------------

    private Articolo trovaArticoloOLancia(Long articleId) {
        return articoloRepository.findById(articleId)
                .orElseThrow(() -> new ArticoloNonTrovatoException("Articolo non trovato."));
    }

    private Articolo trovaBozzaDiProprietaOLancia(Long draftId, Long callerId) {
        Articolo articolo = trovaArticoloOLancia(draftId);
        verificaAutoreOManager(articolo, callerId);
        if (articolo.getStato() != StatoArticolo.BOZZA) {
            throw new StatoArticoloNonValidoException("L'articolo non e' in stato di bozza.");
        }
        return articolo;
    }

    /**
     * Controllo di ownership non richiesto esplicitamente dall'OCL (ODD 2.2), ma necessario per
     * evitare che un Autore modifichi/elimini/pubblichi gli articoli di un altro Autore: il Manager
     * Autori, che eredita i permessi dell'Autore (SDD 3.4, Tabella 1), non e' soggetto al vincolo.
     */
    private void verificaAutoreOManager(Articolo articolo, Long callerId) {
        if (articolo.getAutore().getId().equals(callerId)) {
            return;
        }
        Utente caller = utenteRepository.findById(callerId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente non trovato."));
        if (caller.getRuolo() != Ruolo.MANAGER_AUTORI) {
            throw new AutoreNonValidoException("Non sei autorizzato a operare su questo articolo.");
        }
    }

    private Categoria risolviCategoria(Long categoriaId) {
        if (categoriaId == null) {
            return null;
        }
        return categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new CategoriaNonTrovataException("Categoria non trovata."));
    }

    /**
     * Espande gli id di categoria richiesti includendo, transitivamente, tutte le loro
     * sottocategorie (RF1.2, mockup 02_esplora_articoli.png). L'intero albero e' caricato in
     * memoria (come gia' fa GestioneCategorie.getCategoryTree): accettabile ai volumi attesi
     * (RNF3.3, centinaia di categorie, non milioni).
     */
    private List<Long> espandiConSottocategorie(List<Long> categoriaIds) {
        if (categoriaIds == null || categoriaIds.isEmpty()) {
            return null;
        }

        Map<Long, List<Long>> figliPerPadre = categoriaRepository.findAll().stream()
                .filter(c -> c.getCategoriaPadre() != null)
                .collect(Collectors.groupingBy(c -> c.getCategoriaPadre().getId(),
                        Collectors.mapping(Categoria::getId, Collectors.toList())));

        Set<Long> risultato = new LinkedHashSet<>();
        Deque<Long> daVisitare = new ArrayDeque<>(categoriaIds);
        while (!daVisitare.isEmpty()) {
            Long corrente = daVisitare.poll();
            if (risultato.add(corrente)) {
                daVisitare.addAll(figliPerPadre.getOrDefault(corrente, List.of()));
            }
        }
        return List.copyOf(risultato);
    }

    private Sort risolviOrdinamento(OrdinamentoArticoli ordinamento) {
        return switch (ordinamento) {
            case PIU_RECENTI -> Sort.by(Sort.Direction.DESC, "data_ultimo_aggiornamento");
            // IN_EVIDENZA non ha un campo editoriale dedicato nel modello dati (RAD 3.4.4):
            // trattato come sinonimo di PIU_LETTI (vedi OrdinamentoArticoli).
            case PIU_LETTI, IN_EVIDENZA -> Sort.by(Sort.Direction.DESC, "numero_visualizzazioni");
        };
    }

    private static String unisciTag(List<String> tag) {
        if (tag == null || tag.isEmpty()) {
            return null;
        }
        return String.join(",", tag);
    }

    private static List<String> dividiTag(String tag) {
        if (tag == null || tag.isBlank()) {
            return List.of();
        }
        return Arrays.stream(tag.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private static int calcolaTempoLettura(String testo) {
        if (testo == null || testo.isBlank()) {
            return 0;
        }
        int parole = testo.trim().split("\\s+").length;
        return Math.max(1, (int) Math.ceil(parole / (double) PAROLE_AL_MINUTO));
    }

    private static String calcolaEstratto(String testo) {
        if (testo == null) {
            return null;
        }
        String pulito = testo.strip();
        return pulito.length() <= LUNGHEZZA_ESTRATTO ? pulito : pulito.substring(0, LUNGHEZZA_ESTRATTO) + "...";
    }

    private ArticleSummaryDTO mappaSummary(Articolo articolo) {
        Categoria categoria = articolo.getCategoria();
        Utente autore = articolo.getAutore();
        return new ArticleSummaryDTO(
                articolo.getId(),
                articolo.getTitolo(),
                calcolaEstratto(articolo.getTesto()),
                articolo.getImmagineCopertina(),
                categoria != null ? categoria.getId() : null,
                categoria != null ? categoria.getNome() : null,
                autore.getId(),
                autore.getNome() + " " + autore.getCognome(),
                articolo.getStato(),
                calcolaTempoLettura(articolo.getTesto()),
                articolo.getNumeroVisualizzazioni(),
                DateTimeFormatter.ISO_INSTANT.format(articolo.getDataUltimoAggiornamento())
        );
    }

    private ArticleDetailDTO mappaDettaglio(Articolo articolo) {
        Categoria categoria = articolo.getCategoria();
        Utente autore = articolo.getAutore();
        return new ArticleDetailDTO(
                articolo.getId(),
                articolo.getTitolo(),
                articolo.getTesto(),
                articolo.getImmagineCopertina(),
                dividiTag(articolo.getTag()),
                categoria != null ? categoria.getId() : null,
                categoria != null ? categoria.getNome() : null,
                autore.getId(),
                autore.getNome() + " " + autore.getCognome(),
                articolo.getStato(),
                calcolaTempoLettura(articolo.getTesto()),
                articolo.getNumeroVisualizzazioni(),
                DateTimeFormatter.ISO_INSTANT.format(articolo.getDataCreazione()),
                DateTimeFormatter.ISO_INSTANT.format(articolo.getDataUltimoAggiornamento()),
                articolo.getMotivazioneRifiuto()
        );
    }
}
