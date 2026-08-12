package com.motormindhub.Api.service.gestioneAmministrazioneUtenti;

import com.motormindhub.Api.events.AccountCancellatoEvent;
import com.motormindhub.Api.events.AccountRiattivatoEvent;
import com.motormindhub.Api.events.AccountSospesoEvent;
import com.motormindhub.Api.events.DataExportReadyEvent;
import com.motormindhub.Api.events.RichiestaModificaProfiloEvent;
import com.motormindhub.Api.model.entity.LogAzioneAmministrativa;
import com.motormindhub.Api.model.entity.RichiestaCancellazione;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.Segnalazione;
import com.motormindhub.Api.model.entity.StatoArticolo;
import com.motormindhub.Api.model.entity.StatoRichiestaCancellazione;
import com.motormindhub.Api.model.entity.StatoSegnalazione;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoAzioneAmministrativa;
import com.motormindhub.Api.model.entity.TipoVisitatore;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.entity.VisitaSessione;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.ConteggioVisite;
import com.motormindhub.Api.model.repository.LogAzioneAmministrativaRepository;
import com.motormindhub.Api.model.repository.RichiestaCancellazioneRepository;
import com.motormindhub.Api.model.repository.SegnalazioneRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.model.repository.VisitaSessioneRepository;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.AdministrativeActionLogEntryDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.AdministrativeActionLogFiltersDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.DeletionRequestQueueItemDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.MotivazioneSospensione;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.ReportQueueItemDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.ReportResolutionDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.SuspensionDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.UserManagementDashboardDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.UserSearchCriteriaDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.UserSummaryDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.VisiteStatisticheDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.ContenutiInSospesoException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.GestoreNonAutorizzatoException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.RegolaDiDominioViolataException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.RichiestaCancellazioneNonTrovataException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.SegnalazioneNonTrovataException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.StatoAccountNonValidoException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.UtenteNonTrovatoException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Facade del sottosistema GestioneAmministrazioneUtenti (SDD 3.1, ODD 2.5): moderazione della
 * community (sospensioni, riattivazioni, segnalazioni) ed evasione assistita dei diritti GDPR
 * (cancellazione, esportazione) per il Gestore Utenti. Chiude i cicli aperti da GestioneUtenti
 * (ODD 2.1): reportUser -&gt; resolveReport, requestAccountDeletion -&gt; processAccountDeletion.
 */
@Service
public class GestioneAmministrazioneUtenti {

    private static final int GIORNI_PER_MODIFICA_PROFILO = 7; // RF4.5, UC_26 passo 5: "entro 7 giorni"
    private static final ZoneId ZONA_VISITE = ZoneId.of("Europe/Rome"); // RF3.1, UC_28: confini di periodo percepiti dall'utente italiano

    /**
     * Nome del cookie di sessione anonima (RF3.1, UC_28), condiviso tra VisiteController (che lo
     * legge/scrive) e AuthController (che lo legge soltanto, per la riclassificazione Guest->Iscritto
     * al login): definito qui perche' GestioneAmministrazioneUtenti e' il proprietario del dominio
     * "visite" a cui il cookie appartiene, non nel singolo controller che ne fa uso - un letterale
     * duplicato tra i due controller sarebbe un rischio di divergenza silenziosa (typo in uno dei due
     * spezza la riclassificazione senza errori a compile-time).
     */
    public static final String COOKIE_SESSIONE_VISITE = "mmh_visit_session";

    private final UtenteRepository utenteRepository;
    private final SegnalazioneRepository segnalazioneRepository;
    private final RichiestaCancellazioneRepository richiestaCancellazioneRepository;
    private final ArticoloRepository articoloRepository;
    private final LogAzioneAmministrativaRepository logAzioneAmministrativaRepository;
    private final VisitaSessioneRepository visitaSessioneRepository;
    private final ApplicationEventPublisher eventPublisher;

    public GestioneAmministrazioneUtenti(UtenteRepository utenteRepository,
                                          SegnalazioneRepository segnalazioneRepository,
                                          RichiestaCancellazioneRepository richiestaCancellazioneRepository,
                                          ArticoloRepository articoloRepository,
                                          LogAzioneAmministrativaRepository logAzioneAmministrativaRepository,
                                          VisitaSessioneRepository visitaSessioneRepository,
                                          ApplicationEventPublisher eventPublisher) {
        this.utenteRepository = utenteRepository;
        this.segnalazioneRepository = segnalazioneRepository;
        this.richiestaCancellazioneRepository = richiestaCancellazioneRepository;
        this.articoloRepository = articoloRepository;
        this.logAzioneAmministrativaRepository = logAzioneAmministrativaRepository;
        this.visitaSessioneRepository = visitaSessioneRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * pre: Utente.allInstances()-&gt;exists(u | u.id = userId and u.stato = StatoUtente::ATTIVO)
     * and dto.motivazione &lt;&gt; null
     * and (Utente.allInstances()-&gt;select(u | u.id = userId).ruolo &lt;&gt; Ruolo::GESTORE_UTENTI or userId = callerId)
     * post: Utente.allInstances()-&gt;select(u | u.id = userId).stato = StatoUtente::SOSPESO
     * and LogAzioneAmministrativa.allInstances()-&gt;exists(l | l.utenteTarget.id = userId and l.tipoAzione = TipoAzioneAmministrativa::SOSPENSIONE)
     * (ODD 2.5, RF4.3, UC_23)
     */
    @Transactional
    public void suspendAccount(Long userId, SuspensionDTO dto, Long callerId) {
        Utente utente = utenteRepository.findById(userId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente non trovato."));

        if (utente.getStato() != StatoUtente.ATTIVO) {
            throw new StatoAccountNonValidoException("Solo un account attivo puo' essere sospeso.");
        }
        if (dto.motivazione() == null) {
            // UC_23.1 - ridondante rispetto a @NotNull sul DTO (validazione HTTP a monte): il
            // service non deve dipendere da un livello di validazione esterno per restare corretto
            // se invocato direttamente (stesso pattern di GestioneUtenti.reportUser).
            throw new RegolaDiDominioViolataException("E' necessario selezionare una motivazione per procedere con la sospensione.");
        }
        // Ownership tra pari (non specificato dall'OCL, cfr. GestoreNonAutorizzatoException): un
        // Gestore Utenti compromesso o malevolo non deve poter disattivare la moderazione di un
        // collega. L'auto-sospensione resta permessa - non e' un vettore di sicurezza, solo un
        // incidente recuperabile da un altro Gestore.
        if (utente.getRuolo() == Ruolo.GESTORE_UTENTI && !utente.getId().equals(callerId)) {
            throw new GestoreNonAutorizzatoException("Un Gestore Utenti non puo' sospendere un altro Gestore Utenti.");
        }

        String motivazioneTesto = testoMotivazione(dto.motivazione(), dto.noteAggiuntive());

        utente.setStato(StatoUtente.SOSPESO);
        logAzioneAmministrativaRepository.save(new LogAzioneAmministrativa(utente,
                TipoAzioneAmministrativa.SOSPENSIONE, descrizioneSospensione(dto.durataGiorni(), motivazioneTesto)));

        eventPublisher.publishEvent(new AccountSospesoEvent(utente.getId(), utente.getEmail(),
                motivazioneTesto, dto.durataGiorni()));
    }

    /**
     * pre: Utente.allInstances()-&gt;exists(u | u.id = userId and u.stato = StatoUtente::SOSPESO)
     * post: Utente.allInstances()-&gt;select(u | u.id = userId).stato = StatoUtente::ATTIVO
     * and LogAzioneAmministrativa.allInstances()-&gt;exists(l | l.utenteTarget.id = userId and l.tipoAzione = TipoAzioneAmministrativa::RIATTIVAZIONE)
     * (ODD 2.5, RF4.4, UC_24)
     */
    @Transactional
    public void reactivateAccount(Long userId) {
        Utente utente = utenteRepository.findById(userId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente non trovato."));

        if (utente.getStato() != StatoUtente.SOSPESO) {
            throw new StatoAccountNonValidoException("Solo un account sospeso puo' essere riattivato.");
        }

        utente.setStato(StatoUtente.ATTIVO);
        logAzioneAmministrativaRepository.save(
                new LogAzioneAmministrativa(utente, TipoAzioneAmministrativa.RIATTIVAZIONE, "Riattivazione account"));

        eventPublisher.publishEvent(new AccountRiattivatoEvent(utente.getId(), utente.getEmail()));
    }

    /**
     * pre: Segnalazione.allInstances()-&gt;exists(s | s.id = reportId and (s.stato = StatoSegnalazione::APERTA or s.stato = StatoSegnalazione::IN_GESTIONE))
     * post: Segnalazione.allInstances()-&gt;select(s | s.id = reportId).stato = dto.nuovoStato
     * (ODD 2.5, RF4.5, UC_26)
     *
     * "Scala a sospensione" (UC_26.2) non e' gestito qui: la sospensione vera e propria e' un caso
     * d'uso distinto (UC_23), invocato separatamente dal Gestore Utenti tramite suspendAccount, come
     * indicato esplicitamente dal RAD ("puo' scalare direttamente la segnalazione a sospensione
     * (UC_23)"). Qui la segnalazione viene semplicemente marcata ARCHIVIATA, coerentemente con l'unico
     * effetto che l'OCL di resolveReport le attribuisce.
     */
    @Transactional
    public void resolveReport(Long reportId, ReportResolutionDTO dto) {
        Segnalazione segnalazione = segnalazioneRepository.findById(reportId)
                .orElseThrow(() -> new SegnalazioneNonTrovataException("Segnalazione non trovata."));

        if (segnalazione.getStato() != StatoSegnalazione.APERTA && segnalazione.getStato() != StatoSegnalazione.IN_GESTIONE) {
            throw new SegnalazioneNonTrovataException("La segnalazione e' gia' stata archiviata.");
        }
        if (dto.nuovoStato() != StatoSegnalazione.IN_GESTIONE && dto.nuovoStato() != StatoSegnalazione.ARCHIVIATA) {
            throw new RegolaDiDominioViolataException("Esito di risoluzione non valido.");
        }

        segnalazione.setStato(dto.nuovoStato());

        if (dto.nuovoStato() == StatoSegnalazione.IN_GESTIONE) {
            Utente segnalato = segnalazione.getSegnalato();
            eventPublisher.publishEvent(new RichiestaModificaProfiloEvent(segnalato.getId(), segnalato.getEmail(),
                    GIORNI_PER_MODIFICA_PROFILO));
        }
    }

    /**
     * pre: RichiestaCancellazione.allInstances()-&gt;exists(r | r.id = requestId and r.stato = StatoRichiestaCancellazione::IN_CODA)
     * and not Articolo.allInstances()-&gt;exists(a | a.autore = self.richiesta(requestId).utente and a.stato = StatoArticolo::IN_ATTESA_APPROVAZIONE)
     * post: RichiestaCancellazione.allInstances()-&gt;select(r | r.id = requestId).stato = StatoRichiestaCancellazione::COMPLETATA
     * and self.richiesta(requestId)@pre.utente.stato = StatoUtente::CANCELLATO
     * and LogAzioneAmministrativa.allInstances()-&gt;exists(l | l.utenteTarget.id = self.richiesta(requestId)@pre.utente.id and l.tipoAzione = TipoAzioneAmministrativa::CANCELLAZIONE)
     * (ODD 2.5, RF4.6, UC_25)
     *
     * L'anonimizzazione (Utente.anonimizza(), non l'hard delete) e' la strategia scelta per
     * soddisfare il diritto all'oblio: RNF5.5 ammette esplicitamente entrambe le opzioni
     * ("eliminare O anonimizzare irreversibilmente"), e segnalazioni/richieste_cancellazione/
     * log_azioni_amministrative referenziano utenti.id con FK non nullable (nessun ON DELETE
     * CASCADE in nessuna migrazione esistente): un hard delete violerebbe l'integrita' referenziale
     * e distruggerebbe proprio la cronologia amministrativa che RF4.8 richiede di conservare. La riga
     * Utente resta quindi in Utente.allInstances() (a differenza di una precedente versione di questo
     * contratto, che affermava erroneamente "not exists u | u = ...@pre.utente" - falso, dato che
     * l'id non cambia): l'osservabile corretto e' stato = CANCELLATO, non l'assenza dell'istanza.
     * Diverso da GestioneAutori.removeAuthor (ODD 2.4), la cui post-condizione "not exists" resta
     * invece valida perche' qualificata sul ruolo (u.ruolo = Ruolo::AUTORE), non sull'identita'
     * dell'oggetto.
     */
    @Transactional
    public void processAccountDeletion(Long requestId) {
        RichiestaCancellazione richiesta = richiestaCancellazioneRepository.findById(requestId)
                .orElseThrow(() -> new RichiestaCancellazioneNonTrovataException("Richiesta di cancellazione non trovata."));

        if (richiesta.getStato() != StatoRichiestaCancellazione.IN_CODA) {
            throw new RichiestaCancellazioneNonTrovataException("La richiesta e' gia' stata elaborata.");
        }

        Utente utente = richiesta.getUtente();
        if (articoloRepository.existsByAutoreIdAndStato(utente.getId(), StatoArticolo.IN_ATTESA_APPROVAZIONE)) {
            throw new ContenutiInSospesoException(
                    "Impossibile procedere: l'utente ha articoli in attesa di approvazione (UC_25.1).");
        }

        Long utenteId = utente.getId();
        String emailOriginale = utente.getEmail();

        utente.anonimizza();
        richiesta.setStato(StatoRichiestaCancellazione.COMPLETATA);

        logAzioneAmministrativaRepository.save(new LogAzioneAmministrativa(utente,
                TipoAzioneAmministrativa.CANCELLAZIONE, "Cancellazione account elaborata"));

        eventPublisher.publishEvent(new AccountCancellatoEvent(utenteId, emailOriginale));
    }

    /**
     * pre: Utente.allInstances()-&gt;exists(u | u.id = userId)
     * post: LogAzioneAmministrativa.allInstances()-&gt;exists(l | l.utenteTarget.id = userId and l.tipoAzione = TipoAzioneAmministrativa::ESPORTAZIONE)
     * (ODD 2.5, RF4.7, UC_27)
     *
     * La verifica dell'identita' del richiedente (UC_27 passo 1, "previa verifica") e' un controllo
     * manuale del Gestore Utenti attraverso il canale di supporto, precedente alla chiamata a questo
     * metodo: non e' una pre-condizione OCL (ODD 2.5 non la elenca) ne' e' automatizzabile, dato che
     * avviene fuori banda rispetto al sistema - stesso motivo per cui UC_27.1 ("identita' non
     * verificabile") non ha un'eccezione applicativa dedicata qui.
     */
    @Transactional
    public void exportUserDataAssisted(Long userId) {
        Utente utente = utenteRepository.findById(userId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente non trovato."));

        // Stesso payload minimale di GestioneUtenti.requestAccountDataExport (ODD 2.1): l'aggregazione
        // di articoli salvati e storico editoriale (RNF5.6) resta fuori dallo scope dei contratti OCL
        // di questo metodo (ODD 2.5 non la richiede).
        String datiEsportati = """
                {"nome":"%s","cognome":"%s","email":"%s","ruolo":"%s","dataRegistrazione":"%s"}"""
                .formatted(utente.getNome(), utente.getCognome(), utente.getEmail(),
                        utente.getRuolo(), utente.getDataRegistrazione());

        logAzioneAmministrativaRepository.save(new LogAzioneAmministrativa(utente,
                TipoAzioneAmministrativa.ESPORTAZIONE, "Esportazione dati assistita"));

        eventPublisher.publishEvent(new DataExportReadyEvent(utente.getId(), utente.getEmail(), datiEsportati));
    }

    /**
     * pre: true (nessuna pre-condizione: invocabile da qualunque chiamante, incluso non autenticato)
     * post: (callerRuolo &lt;&gt; null and callerRuolo &lt;&gt; Ruolo::ISCRITTO) implies result-&gt;isEmpty()
     * and (sessioneIdEsistente &lt;&gt; null and VisitaSessione.allInstances()@pre-&gt;exists(v | v.sessioneId = sessioneIdEsistente)) implies result-&gt;isEmpty()
     * and result-&gt;notEmpty() implies VisitaSessione.allInstances()-&gt;exists(v | v.sessioneId = result-&gt;any() and v.tipo = (if callerRuolo = null then TipoVisitatore::GUEST else TipoVisitatore::ISCRITTO endif))
     * (ODD 2.5, RF3.1, UC_28)
     *
     * Stesso filtro di ruolo gia' applicato agli incrementi di numeroVisualizzazioni in
     * GestioneArticoli.getArticleById (ODD 2.2): un ruolo redazionale (Autore/Manager Autori/Gestore
     * Utenti) non genera mai una visita, indipendentemente dal cookie presentato. sessioneIdEsistente
     * e' il valore del cookie mmh_visit_session in ingresso (null se assente): se gia' associato a una
     * VisitaSessione, la sessione e' gia' stata contata e non va duplicata. Il risultato presente
     * segnala al controller (VisiteController) che deve impostare/rinnovare il cookie con il nuovo
     * id; vuoto significa "nessuna azione", sia per esclusione di ruolo sia per deduplica.
     */
    @Transactional
    public Optional<String> registraVisita(String sessioneIdEsistente, Ruolo callerRuolo) {
        if (callerRuolo != null && callerRuolo != Ruolo.ISCRITTO) {
            return Optional.empty();
        }
        if (sessioneIdEsistente != null && visitaSessioneRepository.existsBySessioneId(sessioneIdEsistente)) {
            return Optional.empty();
        }

        String nuovoSessioneId = UUID.randomUUID().toString();
        TipoVisitatore tipo = callerRuolo == null ? TipoVisitatore.GUEST : TipoVisitatore.ISCRITTO;
        visitaSessioneRepository.save(new VisitaSessione(nuovoSessioneId, tipo));
        return Optional.of(nuovoSessioneId);
    }

    /**
     * pre: true
     * post: (sessioneIdCookie &lt;&gt; null and VisitaSessione.allInstances()@pre-&gt;exists(v | v.sessioneId = sessioneIdCookie and v.tipo = TipoVisitatore::GUEST))
     * implies VisitaSessione.allInstances()-&gt;select(v | v.sessioneId = sessioneIdCookie)-&gt;first().tipo = TipoVisitatore::ISCRITTO
     * and (sessioneIdCookie = null or not VisitaSessione.allInstances()@pre-&gt;exists(v | v.sessioneId = sessioneIdCookie and v.tipo = TipoVisitatore::GUEST)) implies VisitaSessione.allInstances() = VisitaSessione.allInstances()@pre
     * (ODD 2.5, RF3.1, UC_28)
     *
     * Riclassifica la sessione anonima (cookie mmh_visit_session, gia' presente prima del login) da
     * Guest a Iscritto quando l'utente effettua con successo il login nella stessa sessione browser
     * che aveva gia' generato una visita da anonimo - stessa VisitaSessione, nessuna nuova riga,
     * nessun nuovo cookie: e' una correzione del tipo gia' registrato, non una nuova visita.
     * Idempotente e senza eccezioni per costruzione (WHERE tipo = GUEST in
     * VisitaSessioneRepository.riclassificaComeIscritto): nessuna azione se il cookie e' assente
     * (nessun consenso analitici, o prima visita del browser), se la sessione non esiste (piu'), o se
     * e' gia' ISCRITTO (un secondo login nella stessa sessione browser non deve fare nulla di
     * osservabile).
     *
     * Chiamata direttamente da AuthController.login, non tramite un evento di dominio come le
     * notifiche di GestioneNotifiche: la lettura del cookie e' un artefatto della richiesta HTTP
     * corrente (stesso motivo per cui VisiteController legge/scrive il cookie a livello web, non in
     * un listener - un evento di dominio porterebbe con se' solo dati applicativi come l'id utente,
     * mai un cookie HTTP) e l'aggiornamento e' un singolo UPDATE indicizzato su sessione_id: non c'e'
     * un'operazione lenta o inaffidabile da disaccoppiare dal flusso sincrono, a differenza dell'invio
     * di un'email (motivo per cui quegli eventi esistono). Login inoltre non passa gia' dal Service
     * Layer (AuthController javadoc: "*authenticate non e' implementato nel Service Layer di
     * GestioneUtenti"), quindi non esiste un metodo di servizio pre-esistente da cui pubblicare
     * l'evento senza introdurre una seconda eccezione architetturale oltre a quella gia' presente.
     */
    @Transactional
    public void riclassificaComeIscritto(String sessioneIdCookie) {
        if (sessioneIdCookie == null) {
            return;
        }
        visitaSessioneRepository.riclassificaComeIscritto(sessioneIdCookie);
    }

    // --- query di sola lettura (nessun contratto OCL formale) ----------------

    /** RF4.1, UC_22 - mockup 38_gestore_dashboard.png. */
    @Transactional(readOnly = true)
    public UserManagementDashboardDTO getUserManagementDashboard() {
        // Esclude i tombstone CANCELLATO (StatoUtente): un account anonimizzato non e' piu' un
        // "utente registrato" ai fini di RF4.1 (cfr. UtenteRepository.search per lo stesso criterio).
        long utentiRegistrati = utenteRepository.countByStatoNot(StatoUtente.CANCELLATO);
        long segnalazioniAperte = segnalazioneRepository.countByStato(StatoSegnalazione.APERTA);
        long richiesteInCoda = richiestaCancellazioneRepository.countByStato(StatoRichiestaCancellazione.IN_CODA);
        return new UserManagementDashboardDTO(utentiRegistrati, segnalazioniAperte, richiesteInCoda);
    }

    /**
     * RF4.2, UC_22 - mockup 39_gestore_gestione_account.png. query normalizzata a "" quando assente:
     * UtenteRepository.search non accetta piu' null (cfr. commento li').
     */
    @Transactional(readOnly = true)
    public List<UserSummaryDTO> searchUsers(UserSearchCriteriaDTO criteria) {
        String query = criteria.query() == null ? "" : criteria.query();
        return utenteRepository.search(query, criteria.stato()).stream()
                .map(u -> new UserSummaryDTO(u.getId(), u.getNome(), u.getCognome(), u.getEmail(),
                        u.getStato(), u.getRuolo(), u.getDataRegistrazione()))
                .toList();
    }

    /** RF4.5, UC_26 - mockup 44_gestore_coda_segnalazioni.png. */
    @Transactional(readOnly = true)
    public List<ReportQueueItemDTO> getReportsQueue() {
        return segnalazioneRepository.findAllByOrderByDataCreazioneDesc().stream()
                .map(s -> new ReportQueueItemDTO(s.getId(), s.getSegnalato().getId(),
                        s.getSegnalato().getNome() + " " + s.getSegnalato().getCognome(),
                        s.getSegnalato().getEmail(), s.getMotivazione(), s.getStato(), s.getDataCreazione()))
                .toList();
    }

    /** RF4.6, UC_25 - mockup 46_gestore_coda_cancellazioni.png. */
    @Transactional(readOnly = true)
    public List<DeletionRequestQueueItemDTO> getDeletionRequestsQueue() {
        return richiestaCancellazioneRepository.findAllByOrderByDataRichiestaDesc().stream()
                .map(r -> new DeletionRequestQueueItemDTO(r.getId(), r.getUtente().getId(),
                        r.getUtente().getNome() + " " + r.getUtente().getCognome(),
                        r.getUtente().getEmail(), r.getStato(), r.getDataRichiesta()))
                .toList();
    }

    /**
     * RF3.1, UC_28 - andamento visite per la dashboard Gestore Utenti. Le 4 finestre sono da inizio
     * periodo corrente (calendario, fuso Europe/Rome), stessa logica di "giornaliero dalla
     * mezzanotte" estesa a settimana/mese/anno - non finestre mobili. Un'unica query con
     * aggregazione condizionale (VisitaSessioneRepository.aggregaConteggi) calcola tutti e 5 gli
     * aggregati in una sola scansione indicizzata, invece di 5 COUNT separate.
     */
    @Transactional(readOnly = true)
    public VisiteStatisticheDTO getVisiteStatistiche() {
        ConfiniPeriodo confini = confiniPeriodo(LocalDate.now(ZONA_VISITE), ZONA_VISITE);
        ConteggioVisite conteggio = visitaSessioneRepository.aggregaConteggi(
                confini.inizioGiorno(), confini.inizioSettimana(), confini.inizioMese(), confini.inizioAnno());
        return new VisiteStatisticheDTO(conteggio.getOggi(), conteggio.getSettimana(), conteggio.getMese(),
                conteggio.getAnno(), conteggio.getTotale());
    }

    /** RF4.8 - mockup 48_gestore_cronologia.png. */
    @Transactional(readOnly = true)
    public List<AdministrativeActionLogEntryDTO> getAdministrativeActionLog(AdministrativeActionLogFiltersDTO filters) {
        String query = filters.query() == null || filters.query().isBlank() ? null : filters.query().toLowerCase();
        return logAzioneAmministrativaRepository.findByFiltro(filters.tipoAzione()).stream()
                .filter(l -> query == null
                        || l.getUtenteTarget().getNome().toLowerCase().contains(query)
                        || l.getUtenteTarget().getCognome().toLowerCase().contains(query)
                        || (l.getDettaglio() != null && l.getDettaglio().toLowerCase().contains(query)))
                .map(l -> new AdministrativeActionLogEntryDTO(l.getDataAzione(), l.getTipoAzione(),
                        l.getUtenteTarget().getId(),
                        l.getUtenteTarget().getNome() + " " + l.getUtenteTarget().getCognome(), l.getDettaglio()))
                .toList();
    }

    // --- helper privati -------------------------------------------------------

    /**
     * Include la motivazione nel dettaglio del log (non solo nell'email, RF4.3): mockup 42
     * "Ricorsi" mostra "Motivazione Sospensione" per il Gestore che valuta un ricorso, e
     * LogAzioneAmministrativa.dettaglio e' l'unica fonte persistita per quel dato.
     */
    private static String descrizioneSospensione(Integer durataGiorni, String motivazioneTesto) {
        String durata = durataGiorni == null ? "permanente" : "%d gg".formatted(durataGiorni);
        return "Sospensione account (%s) — %s".formatted(durata, motivazioneTesto);
    }

    /** Combina l'etichetta della motivazione predefinita con le note libere opzionali (RAD, Tabella Formati §1.5.1). */
    private static String testoMotivazione(MotivazioneSospensione motivazione, String noteAggiuntive) {
        return noteAggiuntive == null || noteAggiuntive.isBlank()
                ? motivazione.getEtichetta()
                : motivazione.getEtichetta() + " - " + noteAggiuntive.trim();
    }

    /**
     * Pure function isolata dal wall-clock (accetta "oggi" invece di chiamare LocalDate.now())
     * apposta per essere testabile senza dipendere dall'istante di esecuzione del test - package-
     * private per essere invocabile direttamente da GestioneAmministrazioneUtentiTest. Settimana da
     * lunedi' (TemporalAdjusters.previousOrSame: resta "oggi" se oggi e' gia' lunedi').
     */
    static ConfiniPeriodo confiniPeriodo(LocalDate oggi, ZoneId zona) {
        Instant inizioGiorno = oggi.atStartOfDay(zona).toInstant();
        Instant inizioSettimana = oggi.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay(zona).toInstant();
        Instant inizioMese = oggi.withDayOfMonth(1).atStartOfDay(zona).toInstant();
        Instant inizioAnno = oggi.withDayOfYear(1).atStartOfDay(zona).toInstant();
        return new ConfiniPeriodo(inizioGiorno, inizioSettimana, inizioMese, inizioAnno);
    }

    record ConfiniPeriodo(Instant inizioGiorno, Instant inizioSettimana, Instant inizioMese, Instant inizioAnno) {
    }
}
