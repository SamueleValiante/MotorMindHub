package com.motormindhub.Api.service.gestioneAutori;

import com.motormindhub.Api.events.ArticoloRecensitoEvent;
import com.motormindhub.Api.events.AutoreInvitatoEvent;
import com.motormindhub.Api.model.entity.Articolo;
import com.motormindhub.Api.model.entity.Categoria;
import com.motormindhub.Api.model.entity.InvitoAutore;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoArticolo;
import com.motormindhub.Api.model.entity.StatoInvito;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.AndamentoApprovazioniRiga;
import com.motormindhub.Api.model.repository.AndamentoCategorieRiga;
import com.motormindhub.Api.model.repository.AndamentoLettureRiga;
import com.motormindhub.Api.model.repository.AndamentoPubblicazioniRiga;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.model.repository.ConteggioArticoliPerAutore;
import com.motormindhub.Api.model.repository.ConteggioArticoliPerAutoreEStato;
import com.motormindhub.Api.model.repository.InvitoAutoreRepository;
import com.motormindhub.Api.model.repository.SommaVisualizzazioniPerCategoriaRiga;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.model.repository.VisualizzazioneArticoloRepository;
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
import com.motormindhub.Api.service.gestioneAutori.exception.ArticoloNonTrovatoException;
import com.motormindhub.Api.service.gestioneAutori.exception.AutoreNonTrovatoException;
import com.motormindhub.Api.service.gestioneAutori.exception.EmailGiaRegistrataException;
import com.motormindhub.Api.service.gestioneAutori.exception.InvitoGiaEsistenteException;
import com.motormindhub.Api.service.gestioneAutori.exception.InvitoNonTrovatoException;
import com.motormindhub.Api.service.gestioneAutori.exception.RegolaDiDominioViolataException;
import com.motormindhub.Api.service.gestioneAutori.exception.StatoArticoloNonValidoException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Facade del sottosistema GestioneAutori (SDD 3.1, ODD 2.4): inviti, revoca e coordinamento del
 * team editoriale, approvazione/rifiuto degli articoli.
 */
@Service
public class GestioneAutori {

    private static final long SCADENZA_INVITO_GIORNI = 7; // RNF9.3 cita "es. 24 ore" per i link
    // sensibili in generale; per un invito a entrare nel team editoriale (non un'azione di
    // sicurezza account-critica come il recupero password) una finestra piu' ampia e' piu'
    // realistica per l'invitato, che deve valutare la proposta - non un'azione impulsiva.
    private static final int ARTICOLI_IN_CODA_DASHBOARD = 3; // mockup 29: "VEDI TUTTI" -> solo un'anteprima

    private static final ZoneId ZONA_STATISTICHE = ZoneId.of("Europe/Rome"); // coerente con GestioneAmministrazioneUtenti.ZONA_VISITE

    /** Stessi limiti/motivazione di GestioneAmministrazioneUtenti.GIORNI_ANDAMENTO_MIN/MAX (§2.5): niente costante condivisa tra sottosistemi, valore duplicato deliberatamente. */
    private static final int GIORNI_ANDAMENTO_MIN = 1;
    private static final int GIORNI_ANDAMENTO_MAX = 90;

    private static final int CATEGORIE_PIU_LETTE_LIMITE = 10; // classifica, non elenco completo - RF3.1

    private final InvitoAutoreRepository invitoAutoreRepository;
    private final UtenteRepository utenteRepository;
    private final ArticoloRepository articoloRepository;
    private final CategoriaRepository categoriaRepository;
    private final VisualizzazioneArticoloRepository visualizzazioneArticoloRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    public GestioneAutori(InvitoAutoreRepository invitoAutoreRepository,
                           UtenteRepository utenteRepository,
                           ArticoloRepository articoloRepository,
                           CategoriaRepository categoriaRepository,
                           VisualizzazioneArticoloRepository visualizzazioneArticoloRepository,
                           PasswordEncoder passwordEncoder,
                           ApplicationEventPublisher eventPublisher) {
        this.invitoAutoreRepository = invitoAutoreRepository;
        this.utenteRepository = utenteRepository;
        this.articoloRepository = articoloRepository;
        this.categoriaRepository = categoriaRepository;
        this.visualizzazioneArticoloRepository = visualizzazioneArticoloRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
    }

    /**
     * pre: not exists i | i.email = dto.email and i.stato = INVIATO
     * post: exists i | i.email = dto.email and i.stato = INVIATO and i.ruoloProposto = dto.ruolo
     * (ODD 2.4, RF3.3, UC_8, UC_9)
     */
    @Transactional
    public Long inviteAuthor(InviteAuthorDTO dto) {
        if (dto.ruolo() != Ruolo.AUTORE && dto.ruolo() != Ruolo.MANAGER_AUTORI) {
            throw new RegolaDiDominioViolataException("Il ruolo proposto deve essere AUTORE o MANAGER_AUTORI.");
        }
        if (invitoAutoreRepository.existsByEmailAndStato(dto.email(), StatoInvito.INVIATO)) {
            throw new InvitoGiaEsistenteException("Esiste gia' un invito attivo per questo indirizzo email.");
        }
        // Guardia difensiva non richiesta esplicitamente dall'OCL, ma necessaria per non violare
        // l'invariante di unicita' email di GestioneUtenti quando acceptInvite creera' il nuovo Utente.
        if (utenteRepository.existsByEmail(dto.email())) {
            throw new EmailGiaRegistrataException("Un account con questo indirizzo email esiste gia'.");
        }

        String token = UUID.randomUUID().toString();
        Instant dataScadenza = Instant.now().plus(SCADENZA_INVITO_GIORNI, ChronoUnit.DAYS);
        InvitoAutore invito = new InvitoAutore(dto.nome(), dto.cognome(), dto.email(), dto.ruolo(), token, dataScadenza);
        invito = invitoAutoreRepository.save(invito);

        eventPublisher.publishEvent(new AutoreInvitatoEvent(invito.getId(), invito.getNome(), invito.getEmail(), token));
        return invito.getId();
    }

    /**
     * pre: exists i | i.token = token and i.stato = INVIATO and i.dataScadenza > now()
     * post: i.stato = ACCETTATO  and  exists u | u.email = invitoAutore(token).email and u.stato = ATTIVO
     * (ODD 2.4, UC_10)
     *
     * Nota di collaborazione tra sottosistemi (ODD 2.4): la creazione dell'Utente e' delegata
     * direttamente al repository condiviso di GestioneUtenti, senza passare da
     * GestioneUtenti.registerUser - quel metodo ha semantica diversa (ruolo ISCRITTO,
     * stato NON_VERIFICATO in attesa di conferma email, consenso privacy esplicito) e non si
     * applica qui: il click sul link dell'invito prova gia' il possesso della casella email.
     */
    @Transactional
    public Long acceptInvite(String token, SetPasswordDTO dto) {
        InvitoAutore invito = invitoAutoreRepository.findByToken(token)
                .filter(InvitoAutore::isValido)
                .orElseThrow(() -> new InvitoNonTrovatoException("L'invito non e' valido, e' scaduto o e' gia' stato processato."));

        Utente utente = new Utente(invito.getNome(), invito.getCognome(), invito.getEmail(),
                passwordEncoder.encode(dto.password()), null, null, true, null);
        utente.setRuolo(invito.getRuoloProposto());
        utente.setStato(StatoUtente.ATTIVO);
        utente = utenteRepository.save(utente);

        invito.accetta();
        return utente.getId();
    }

    /**
     * pre: exists i | i.token = token and i.stato = INVIATO
     * post: i.stato = RIFIUTATO
     * (ODD 2.4, UC_10)
     */
    @Transactional
    public void declineInvite(String token) {
        InvitoAutore invito = invitoAutoreRepository.findByToken(token)
                .filter(i -> i.getStato() == StatoInvito.INVIATO)
                .orElseThrow(() -> new InvitoNonTrovatoException("L'invito non e' valido o e' gia' stato processato."));

        invito.rifiuta();
    }

    /**
     * pre: exists u | u.id = authorId and u.ruolo = AUTORE
     * post: not exists u | u.id = authorId and u.ruolo = AUTORE
     *       and (dto.mantieniArticoli or not exists a | a.autore.id = authorId)
     * (ODD 2.4, RF3.4, UC_11)
     *
     * "Revoca dei permessi" (RF3.4): l'account non viene eliminato, viene retrocesso a ISCRITTO -
     * coerente col post-condition, che richiede solo l'assenza di un Utente con quell'id E ruolo
     * AUTORE, non l'assenza dell'Utente stesso.
     */
    @Transactional
    public void removeAuthor(Long authorId, RemoveAuthorPolicyDTO dto) {
        Utente autore = utenteRepository.findById(authorId)
                .filter(u -> u.getRuolo() == Ruolo.AUTORE)
                .orElseThrow(() -> new AutoreNonTrovatoException("Autore non trovato."));

        if (!Boolean.TRUE.equals(dto.mantieniArticoli())) {
            articoloRepository.deleteByAutoreId(authorId);
        }

        autore.setRuolo(Ruolo.ISCRITTO);
    }

    /**
     * pre: exists a | a.id = articleId and a.stato = IN_ATTESA_APPROVAZIONE
     * post: a.stato = PUBBLICATO
     * (ODD 2.4, RF3.6, UC_21)
     */
    @Transactional
    public void approveArticle(Long articleId) {
        Articolo articolo = trovaArticoloInAttesaOLancia(articleId);
        articolo.approva();

        eventPublisher.publishEvent(new ArticoloRecensitoEvent(articolo.getId(), articolo.getAutore().getId(),
                articolo.getAutore().getEmail(), true, null));
    }

    /**
     * pre: exists a | a.id = articleId and a.stato = IN_ATTESA_APPROVAZIONE  and  dto.motivazione.size() > 0
     * post: a.stato = RIFIUTATO
     * (ODD 2.4, RF3.6, UC_21)
     */
    @Transactional
    public void rejectArticle(Long articleId, RejectionReasonDTO dto) {
        if (dto.motivazione() == null || dto.motivazione().isBlank()) {
            throw new RegolaDiDominioViolataException("E' necessario indicare una motivazione per il rifiuto.");
        }

        Articolo articolo = trovaArticoloInAttesaOLancia(articleId);
        articolo.rifiuta(dto.motivazione());

        eventPublisher.publishEvent(new ArticoloRecensitoEvent(articolo.getId(), articolo.getAutore().getId(),
                articolo.getAutore().getEmail(), false, dto.motivazione()));
    }

    /**
     * Query di sola lettura (RF3.2, UC_8) - nessun contratto OCL formale. Il conteggio articoli per
     * autore e' una singola query aggregata (GROUP BY) sull'insieme degli id, non una countByAutoreId
     * per autore dentro il .map() - quest'ultima era un N+1 esplicito (una query per riga, non
     * lazy-loading), trovato durante l'audit di sicurezza sulla paginazione/N+1 di tutti gli endpoint
     * che restituiscono liste.
     */
    @Transactional(readOnly = true)
    public List<AuthorSummaryDTO> listAuthors() {
        List<Utente> autori = utenteRepository.findByRuolo(Ruolo.AUTORE);
        List<Long> autoreIds = autori.stream().map(Utente::getId).toList();
        Map<Long, Long> conteggiPerAutore = autoreIds.isEmpty()
                ? Map.of()
                : articoloRepository.countByAutoreIdIn(autoreIds).stream()
                        .collect(Collectors.toMap(ConteggioArticoliPerAutore::getAutoreId, ConteggioArticoliPerAutore::getConteggio));
        Map<Long, Map<StatoArticolo, Long>> conteggiPerAutoreEStato = autoreIds.isEmpty()
                ? Map.of()
                : articoloRepository.countByAutoreIdInGroupByStato(autoreIds).stream()
                        .collect(Collectors.groupingBy(ConteggioArticoliPerAutoreEStato::getAutoreId,
                                Collectors.toMap(ConteggioArticoliPerAutoreEStato::getStato, ConteggioArticoliPerAutoreEStato::getConteggio)));

        return autori.stream()
                .map(u -> new AuthorSummaryDTO(u.getId(), u.getNome(), u.getCognome(), u.getEmail(),
                        conteggiPerAutore.getOrDefault(u.getId(), 0L), u.getStato(),
                        calcolaPercentualeApprovazione(conteggiPerAutoreEStato.getOrDefault(u.getId(), Map.of()))))
                .toList();
    }

    /** Query di sola lettura (RF3.1, UC_21) - nessun contratto OCL formale. */
    @Transactional(readOnly = true)
    public List<PendingArticleDTO> getPendingArticles() {
        return articoloRepository.findByStatoOrderByDataUltimoAggiornamentoDesc(StatoArticolo.IN_ATTESA_APPROVAZIONE).stream()
                .map(this::mappaPending)
                .toList();
    }

    /**
     * Query di sola lettura (RF3.1) - nessun contratto OCL formale. Il grafico "Andamento visite"
     * del mockup 29_manager_dashboard.png non e' incluso qui: il tracciamento ora esiste
     * (GestioneAmministrazioneUtenti.getVisiteStatistiche, RF3.1/UC_28) ma e' esposto solo sulla
     * dashboard del Gestore Utenti, non su questa - scelta di scope di quel lavoro, non una lacuna
     * residua dell'Object Model.
     */
    @Transactional(readOnly = true)
    public ManagerDashboardStatsDTO getManagerDashboardStats() {
        long pubblicati = articoloRepository.countByStato(StatoArticolo.PUBBLICATO);
        long inAttesa = articoloRepository.countByStato(StatoArticolo.IN_ATTESA_APPROVAZIONE);
        long autoriAttivi = utenteRepository.countByRuoloAndStato(Ruolo.AUTORE, StatoUtente.ATTIVO);
        long categorieTotali = categoriaRepository.count();

        List<PendingArticleDTO> coda = articoloRepository
                .findByStatoOrderByDataUltimoAggiornamentoDesc(StatoArticolo.IN_ATTESA_APPROVAZIONE).stream()
                .limit(ARTICOLI_IN_CODA_DASHBOARD)
                .map(this::mappaPending)
                .toList();

        return new ManagerDashboardStatsDTO(pubblicati, inAttesa, autoriAttivi, categorieTotali, coda);
    }

    /**
     * RF3.1 - andamento giornaliero delle pubblicazioni per il grafico "Andamento pubblicazioni"
     * della dashboard Manager Autori, finestra di [giorni] giorni terminante oggi (fuso Europe/Rome),
     * stesso clamp/zero-fill di GestioneAmministrazioneUtenti.andamentoVisite (§2.5). Bucket su
     * Articolo.dataDecisione, la sola data che rappresenta realmente "quando l'articolo e' diventato
     * PUBBLICATO" - dataCreazione e' la bozza, dataUltimoAggiornamento si sposta a ogni correzione
     * post-pubblicazione.
     */
    @Transactional(readOnly = true)
    public List<PuntoAndamentoPubblicazioniDTO> andamentoPubblicazioni(int giorni) {
        int giorniClampati = clampGiorni(giorni);
        LocalDate oggi = LocalDate.now(ZONA_STATISTICHE);
        LocalDate primoGiorno = oggi.minusDays(giorniClampati - 1L);
        Instant da = primoGiorno.atStartOfDay(ZONA_STATISTICHE).toInstant();

        Map<LocalDate, Long> perGiorno = articoloRepository.andamentoPubblicazioniGiornaliero(da).stream()
                .collect(Collectors.toMap(AndamentoPubblicazioniRiga::getGiorno, AndamentoPubblicazioniRiga::getNumero));

        return primoGiorno.datesUntil(oggi.plusDays(1))
                .map(giorno -> new PuntoAndamentoPubblicazioniDTO(giorno, perGiorno.getOrDefault(giorno, 0L)))
                .toList();
    }

    /**
     * RF3.1 - andamento giornaliero delle nuove categorie per il grafico "Andamento categorie" della
     * dashboard Manager Autori, stesso clamp/zero-fill/fuso di andamentoPubblicazioni. Bucket su
     * Categoria.dataCreazione.
     */
    @Transactional(readOnly = true)
    public List<PuntoAndamentoCategorieDTO> andamentoCategorie(int giorni) {
        int giorniClampati = clampGiorni(giorni);
        LocalDate oggi = LocalDate.now(ZONA_STATISTICHE);
        LocalDate primoGiorno = oggi.minusDays(giorniClampati - 1L);
        Instant da = primoGiorno.atStartOfDay(ZONA_STATISTICHE).toInstant();

        Map<LocalDate, Long> perGiorno = categoriaRepository.andamentoGiornaliero(da).stream()
                .collect(Collectors.toMap(AndamentoCategorieRiga::getGiorno, AndamentoCategorieRiga::getNumero));

        return primoGiorno.datesUntil(oggi.plusDays(1))
                .map(giorno -> new PuntoAndamentoCategorieDTO(giorno, perGiorno.getOrDefault(giorno, 0L)))
                .toList();
    }

    /**
     * RF3.1 - andamento giornaliero approvati/rifiutati per il grafico "Andamento approvazioni"
     * della dashboard Manager Autori, stesso clamp/zero-fill/fuso/bucket-su-dataDecisione di
     * andamentoPubblicazioni. A differenza di quest'ultimo (solo PUBBLICATO), include anche RIFIUTATO:
     * le due serie condividono lo stesso asse temporale perche' entrambe originano dalla stessa
     * decisione del Manager nello stesso istante.
     */
    @Transactional(readOnly = true)
    public List<PuntoAndamentoApprovazioniDTO> andamentoApprovazioni(int giorni) {
        int giorniClampati = clampGiorni(giorni);
        LocalDate oggi = LocalDate.now(ZONA_STATISTICHE);
        LocalDate primoGiorno = oggi.minusDays(giorniClampati - 1L);
        Instant da = primoGiorno.atStartOfDay(ZONA_STATISTICHE).toInstant();

        Map<LocalDate, AndamentoApprovazioniRiga> perGiorno = articoloRepository.andamentoApprovazioniGiornaliero(da).stream()
                .collect(Collectors.toMap(AndamentoApprovazioniRiga::getGiorno, riga -> riga));

        return primoGiorno.datesUntil(oggi.plusDays(1))
                .map(giorno -> {
                    AndamentoApprovazioniRiga riga = perGiorno.get(giorno);
                    return new PuntoAndamentoApprovazioniDTO(giorno,
                            riga == null ? 0 : riga.getApprovati(), riga == null ? 0 : riga.getRifiutati());
                })
                .toList();
    }

    /**
     * RF3.1 - andamento giornaliero delle letture per il grafico "Andamento letture" della dashboard
     * Manager Autori, stesso clamp/zero-fill/fuso di andamentoPubblicazioni. Bucket su
     * VisualizzazioneArticolo.dataLettura (ODD 2.2 getArticleById): sito-wide, non filtrato per
     * autore - a differenza di categorie-piu-lette (che aggrega per categoria), qui la serie e' un
     * totale unico su tutti gli articoli.
     */
    @Transactional(readOnly = true)
    public List<PuntoAndamentoLettureDTO> andamentoLetture(int giorni) {
        int giorniClampati = clampGiorni(giorni);
        LocalDate oggi = LocalDate.now(ZONA_STATISTICHE);
        LocalDate primoGiorno = oggi.minusDays(giorniClampati - 1L);
        Instant da = primoGiorno.atStartOfDay(ZONA_STATISTICHE).toInstant();

        Map<LocalDate, Long> perGiorno = visualizzazioneArticoloRepository.andamentoGiornaliero(da).stream()
                .collect(Collectors.toMap(AndamentoLettureRiga::getGiorno, AndamentoLettureRiga::getNumero));

        return primoGiorno.datesUntil(oggi.plusDays(1))
                .map(giorno -> new PuntoAndamentoLettureDTO(giorno, perGiorno.getOrDefault(giorno, 0L)))
                .toList();
    }

    /**
     * RF3.1 - classifica delle top {@value CATEGORIE_PIU_LETTE_LIMITE} categorie per visualizzazioni
     * totali degli articoli PUBBLICATO, con la stessa espansione gerarchica alle sottocategorie di
     * GestioneArticoli.espandiConSottocategorie/GestioneCategorie.getCategoryTree (albero caricato
     * interamente in memoria, figli raggruppati per id del padre): qui pero' il rollup e' bottom-up
     * (somma propria + sottoalbero), non un filtro top-down, quindi ogni categoria "eredita" anche le
     * visualizzazioni delle sue sottocategorie, non solo le proprie.
     */
    @Transactional(readOnly = true)
    public List<CategoriaPiuLettaDTO> getCategoriePiuLette() {
        Map<Long, Long> visualizzazioniProprie = articoloRepository.sommaVisualizzazioniPerCategoria().stream()
                .collect(Collectors.toMap(SommaVisualizzazioniPerCategoriaRiga::getCategoriaId, SommaVisualizzazioniPerCategoriaRiga::getTotale));

        List<Categoria> tutte = categoriaRepository.findAll();
        Map<Long, List<Categoria>> figliePerPadre = tutte.stream()
                .filter(c -> c.getCategoriaPadre() != null)
                .collect(Collectors.groupingBy(c -> c.getCategoriaPadre().getId()));

        Map<Long, Long> totaliConSottocategorie = new HashMap<>();
        for (Categoria categoria : tutte) {
            sommaConSottocategorie(categoria, figliePerPadre, visualizzazioniProprie, totaliConSottocategorie);
        }

        return tutte.stream()
                .map(c -> new CategoriaPiuLettaDTO(c.getId(), c.getNome(), totaliConSottocategorie.getOrDefault(c.getId(), 0L)))
                .sorted(Comparator.comparingLong(CategoriaPiuLettaDTO::totaleVisualizzazioni).reversed())
                .limit(CATEGORIE_PIU_LETTE_LIMITE)
                .toList();
    }

    // --- helper privati -----------------------------------------------------

    /** Vincola "giorni" a [GIORNI_ANDAMENTO_MIN, GIORNI_ANDAMENTO_MAX] (cfr. andamentoPubblicazioni/andamentoCategorie/andamentoApprovazioni). */
    private static int clampGiorni(int giorni) {
        return Math.min(Math.max(giorni, GIORNI_ANDAMENTO_MIN), GIORNI_ANDAMENTO_MAX);
    }

    /**
     * PUBBLICATO / (IN_ATTESA_APPROVAZIONE + PUBBLICATO + RIFIUTATO); null (non 0.0) quando
     * l'autore non ha mai sottomesso un articolo, per distinguere "nessun dato" da "0% di successo".
     */
    private static Double calcolaPercentualeApprovazione(Map<StatoArticolo, Long> conteggiPerStato) {
        long pubblicati = conteggiPerStato.getOrDefault(StatoArticolo.PUBBLICATO, 0L);
        long inAttesa = conteggiPerStato.getOrDefault(StatoArticolo.IN_ATTESA_APPROVAZIONE, 0L);
        long rifiutati = conteggiPerStato.getOrDefault(StatoArticolo.RIFIUTATO, 0L);
        long denominatore = pubblicati + inAttesa + rifiutati;
        return denominatore == 0 ? null : (double) pubblicati / denominatore;
    }

    /** Somma ricorsiva memoizzata propria+sottoalbero per getCategoriePiuLette; l'albero e' aciclico per costruzione (Categoria javadoc). */
    private static long sommaConSottocategorie(Categoria categoria, Map<Long, List<Categoria>> figliePerPadre,
                                                Map<Long, Long> visualizzazioniProprie, Map<Long, Long> memo) {
        Long giaCalcolato = memo.get(categoria.getId());
        if (giaCalcolato != null) {
            return giaCalcolato;
        }
        long totale = visualizzazioniProprie.getOrDefault(categoria.getId(), 0L);
        for (Categoria figlia : figliePerPadre.getOrDefault(categoria.getId(), List.of())) {
            totale += sommaConSottocategorie(figlia, figliePerPadre, visualizzazioniProprie, memo);
        }
        memo.put(categoria.getId(), totale);
        return totale;
    }

    private Articolo trovaArticoloInAttesaOLancia(Long articleId) {
        Articolo articolo = articoloRepository.findById(articleId)
                .orElseThrow(() -> new ArticoloNonTrovatoException("Articolo non trovato."));
        if (articolo.getStato() != StatoArticolo.IN_ATTESA_APPROVAZIONE) {
            throw new StatoArticoloNonValidoException("L'articolo non e' in attesa di approvazione.");
        }
        return articolo;
    }

    private PendingArticleDTO mappaPending(Articolo articolo) {
        Utente autore = articolo.getAutore();
        Categoria categoria = articolo.getCategoria();
        return new PendingArticleDTO(
                articolo.getId(),
                articolo.getTitolo(),
                autore.getNome() + " " + autore.getCognome(),
                categoria != null ? categoria.getNome() : null,
                DateTimeFormatter.ISO_INSTANT.format(articolo.getDataUltimoAggiornamento())
        );
    }
}
