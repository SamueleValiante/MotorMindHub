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
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.CategoriaRepository;
import com.motormindhub.Api.model.repository.InvitoAutoreRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.service.gestioneAutori.dto.AuthorSummaryDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.InviteAuthorDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.ManagerDashboardStatsDTO;
import com.motormindhub.Api.service.gestioneAutori.dto.PendingArticleDTO;
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
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

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

    private final InvitoAutoreRepository invitoAutoreRepository;
    private final UtenteRepository utenteRepository;
    private final ArticoloRepository articoloRepository;
    private final CategoriaRepository categoriaRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    public GestioneAutori(InvitoAutoreRepository invitoAutoreRepository,
                           UtenteRepository utenteRepository,
                           ArticoloRepository articoloRepository,
                           CategoriaRepository categoriaRepository,
                           PasswordEncoder passwordEncoder,
                           ApplicationEventPublisher eventPublisher) {
        this.invitoAutoreRepository = invitoAutoreRepository;
        this.utenteRepository = utenteRepository;
        this.articoloRepository = articoloRepository;
        this.categoriaRepository = categoriaRepository;
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

    /** Query di sola lettura (RF3.2, UC_8) - nessun contratto OCL formale. */
    @Transactional(readOnly = true)
    public List<AuthorSummaryDTO> listAuthors() {
        return utenteRepository.findByRuolo(Ruolo.AUTORE).stream()
                .map(u -> new AuthorSummaryDTO(u.getId(), u.getNome(), u.getCognome(), u.getEmail(),
                        articoloRepository.countByAutoreId(u.getId()), u.getStato()))
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
     * del mockup 29_manager_dashboard.png non e' incluso: richiederebbe un tracciamento delle
     * visualizzazioni per data assente dall'Object Model (RAD 3.4.4).
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

    // --- helper privati -----------------------------------------------------

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
