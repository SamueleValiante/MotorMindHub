package com.motormindhub.Api.service.gestioneUtenti;

import com.motormindhub.Api.events.BruteForceLockoutEvent;
import com.motormindhub.Api.events.DataExportReadyEvent;
import com.motormindhub.Api.events.PasswordResetRequestedEvent;
import com.motormindhub.Api.events.UtenteRegistratoEvent;
import com.motormindhub.Api.model.entity.RichiestaCancellazione;
import com.motormindhub.Api.model.entity.Segnalazione;
import com.motormindhub.Api.model.entity.StatoRichiestaCancellazione;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TokenRecuperoPassword;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.RichiestaCancellazioneRepository;
import com.motormindhub.Api.model.repository.SegnalazioneRepository;
import com.motormindhub.Api.model.repository.TokenRecuperoPasswordRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.service.gestioneUtenti.dto.CurrentUserDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.NewPasswordDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.PublicProfileDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.RegisterUserDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.ReportUserDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.UpdateProfileDTO;
import com.motormindhub.Api.service.gestioneUtenti.exception.AccountNonAttivoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.EmailGiaRegistrataException;
import com.motormindhub.Api.service.gestioneUtenti.exception.RegolaDiDominioViolataException;
import com.motormindhub.Api.service.gestioneUtenti.exception.RichiestaCancellazioneEsistenteException;
import com.motormindhub.Api.service.gestioneUtenti.exception.TokenNonValidoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.UtenteNonTrovatoException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Facade del sottosistema GestioneUtenti (SDD 3.1, ODD 2.1). Implementa registrazione,
 * autenticazione self-service (profilo, GDPR, segnalazioni) per Guest e Iscritto. *authenticate
 * non e' implementato qui: e' delegato nativamente alla filter chain di Spring Security
 * (vedi /security e /config.SecurityConfig).
 */
@Service
public class GestioneUtenti {

    private static final long SCADENZA_TOKEN_RECUPERO_PASSWORD_ORE = 24; // RNF9.3

    // RNF2.6: soglia e durata del blocco non sono specificate numericamente dal RAD ("dopo n
    // tentativi... bloccato temporaneamente") - valori ragionevoli per un blocco anti-bruteforce,
    // analoghi a quelli tipicamente usati per form di login pubblici.
    private static final int MAX_TENTATIVI_LOGIN_FALLITI = 5;
    private static final long DURATA_BLOCCO_MINUTI = 15;

    private final UtenteRepository utenteRepository;
    private final TokenRecuperoPasswordRepository tokenRecuperoPasswordRepository;
    private final SegnalazioneRepository segnalazioneRepository;
    private final RichiestaCancellazioneRepository richiestaCancellazioneRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    public GestioneUtenti(UtenteRepository utenteRepository,
                           TokenRecuperoPasswordRepository tokenRecuperoPasswordRepository,
                           SegnalazioneRepository segnalazioneRepository,
                           RichiestaCancellazioneRepository richiestaCancellazioneRepository,
                           PasswordEncoder passwordEncoder,
                           ApplicationEventPublisher eventPublisher) {
        this.utenteRepository = utenteRepository;
        this.tokenRecuperoPasswordRepository = tokenRecuperoPasswordRepository;
        this.segnalazioneRepository = segnalazioneRepository;
        this.richiestaCancellazioneRepository = richiestaCancellazioneRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
    }

    /**
     * pre: not exists u | u.email = dto.email  and  dto.consensoPrivacy = true
     * post: exists u | u.email = dto.email and u.stato = NON_VERIFICATO and u.ruolo = ISCRITTO
     * (ODD 2.1, RF1.3, UC_1)
     */
    @Transactional
    public Long registerUser(RegisterUserDTO dto) {
        if (!dto.consensoPrivacy()) {
            throw new RegolaDiDominioViolataException(
                    "E' obbligatorio accettare l'informativa sulla privacy per procedere con la registrazione.");
        }
        if (utenteRepository.existsByEmail(dto.email())) {
            throw new EmailGiaRegistrataException("Un account con questo indirizzo email esiste gia'.");
        }

        String tokenVerifica = UUID.randomUUID().toString();
        Utente utente = new Utente(
                dto.nome(),
                dto.cognome(),
                dto.email(),
                passwordEncoder.encode(dto.password()),
                dto.fotoProfilo(),
                dto.biografia(),
                true,
                tokenVerifica
        );
        utente = utenteRepository.save(utente);

        eventPublisher.publishEvent(new UtenteRegistratoEvent(utente.getId(), utente.getEmail(), utente.getNome(), tokenVerifica));
        return utente.getId();
    }

    /**
     * pre: exists u | u.tokenVerifica = token and u.stato = NON_VERIFICATO
     * post: quell'u.stato = ATTIVO
     * (ODD 2.1, RF1.3, UC_1)
     */
    @Transactional
    public void verifyEmail(String token) {
        Utente utente = utenteRepository.findByTokenVerifica(token)
                .filter(u -> u.getStato() == StatoUtente.NON_VERIFICATO)
                .orElseThrow(() -> new TokenNonValidoException("Il link di verifica non e' valido o e' gia' stato utilizzato."));

        utente.setStato(StatoUtente.ATTIVO);
        utente.setTokenVerifica(null);
    }

    /**
     * pre: exists u | u.email = email and u.stato = ATTIVO
     * post: exists t | t.utente.email = email and t.utilizzato = false and t.dataScadenza > now()
     * (ODD 2.1, RF1.5, UC_3)
     */
    @Transactional
    public void requestPasswordReset(String email) {
        Utente utente = utenteRepository.findByEmail(email)
                .filter(u -> u.getStato() == StatoUtente.ATTIVO)
                .orElseThrow(() -> new AccountNonAttivoException(
                        "Se l'indirizzo email e' associato a un account attivo, riceverai le istruzioni per il recupero."));

        String token = UUID.randomUUID().toString();
        Instant dataScadenza = Instant.now().plus(SCADENZA_TOKEN_RECUPERO_PASSWORD_ORE, ChronoUnit.HOURS);
        TokenRecuperoPassword tokenRecupero = new TokenRecuperoPassword(utente, token, dataScadenza);
        tokenRecuperoPasswordRepository.save(tokenRecupero);

        eventPublisher.publishEvent(new PasswordResetRequestedEvent(utente.getId(), utente.getEmail(), token));
    }

    /**
     * pre: exists t | t.token = token and t.utilizzato = false and t.dataScadenza > now()
     * post: t.utilizzato = true  and  utente.passwordHash cambiato
     * (ODD 2.1, RF1.5, UC_3)
     */
    @Transactional
    public void resetPassword(String token, NewPasswordDTO dto) {
        TokenRecuperoPassword tokenRecupero = tokenRecuperoPasswordRepository.findByToken(token)
                .filter(TokenRecuperoPassword::isValido)
                .orElseThrow(() -> new TokenNonValidoException("Il link di recupero non e' valido, e' scaduto o e' gia' stato utilizzato."));

        Utente utente = tokenRecupero.getUtente();
        utente.setPasswordHash(passwordEncoder.encode(dto.password()));
        tokenRecupero.setUtilizzato(true);
    }

    /**
     * pre: exists u | u.id = userId  and  dto.biografia.size() <= 1000
     * post: u.biografia = dto.biografia (e analogamente nome, cognome, fotoProfilo)
     * (ODD 2.1, RF1.6, UC_4)
     */
    @Transactional
    public void updateProfile(Long userId, UpdateProfileDTO dto) {
        Utente utente = utenteRepository.findById(userId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente non trovato."));

        if (dto.biografia() != null && dto.biografia().length() > 1000) {
            throw new RegolaDiDominioViolataException("La biografia ha superato il limite massimo di caratteri consentiti.");
        }

        utente.setNome(dto.nome());
        utente.setCognome(dto.cognome());
        utente.setFotoProfilo(dto.fotoProfilo());
        utente.setBiografia(dto.biografia());
    }

    /** Query di sola lettura (RF1.9) - nessun contratto OCL formale. */
    @Transactional(readOnly = true)
    public PublicProfileDTO getPublicProfile(Long userId) {
        Utente utente = utenteRepository.findById(userId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente non trovato."));

        return new PublicProfileDTO(utente.getId(), utente.getNome(), utente.getCognome(),
                utente.getFotoProfilo(), utente.getBiografia());
    }

    /**
     * Query di sola lettura (self-service) - nessun contratto OCL formale. userId proviene sempre
     * dal principal autenticato in SecurityContext (UtentiController), mai da un parametro esterno:
     * per costruzione un utente non puo' richiedere il profilo di qualcun altro tramite questo
     * metodo.
     */
    @Transactional(readOnly = true)
    public CurrentUserDTO getCurrentUser(Long userId) {
        Utente utente = utenteRepository.findById(userId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente non trovato."));

        return new CurrentUserDTO(utente.getEmail(), utente.getRuolo(), utente.getStato(),
                utente.getDataRegistrazione(), utente.getNome(), utente.getCognome(),
                utente.getFotoProfilo(), utente.getBiografia());
    }

    /**
     * pre: exists u | u.id = userId and u.stato = ATTIVO
     * post: pubblica l'evento DataExportReady consumato da GestioneNotifiche (SDD 3.5)
     * (ODD 2.1, RF1.10)
     *
     * Nota: l'esportazione include qui solo i dati anagrafici di competenza di GestioneUtenti.
     * L'aggregazione di articoli salvati e storico editoriale (RNF5.6) richiede GestioneArticoli,
     * non ancora implementato.
     */
    @Transactional(readOnly = true)
    public void requestAccountDataExport(Long userId) {
        Utente utente = utenteRepository.findById(userId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente non trovato."));

        if (utente.getStato() != StatoUtente.ATTIVO) {
            throw new AccountNonAttivoException("L'account non e' attivo.");
        }

        String datiEsportati = """
                {"nome":"%s","cognome":"%s","email":"%s","biografia":"%s","ruolo":"%s","dataRegistrazione":"%s"}"""
                .formatted(utente.getNome(), utente.getCognome(), utente.getEmail(),
                        utente.getBiografia() == null ? "" : utente.getBiografia(),
                        utente.getRuolo(), utente.getDataRegistrazione());

        eventPublisher.publishEvent(new DataExportReadyEvent(utente.getId(), utente.getEmail(), datiEsportati));
    }

    /**
     * pre: not exists r | r.utente.id = userId and r.stato &lt;&gt; RESPINTA
     * post: exists r | r.utente.id = userId and r.stato = IN_CODA
     * (ODD 2.1, RF1.10, UC_25)
     */
    @Transactional
    public void requestAccountDeletion(Long userId) {
        Utente utente = utenteRepository.findById(userId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente non trovato."));

        if (richiestaCancellazioneRepository.existsByUtenteIdAndStatoNot(userId, StatoRichiestaCancellazione.RESPINTA)) {
            throw new RichiestaCancellazioneEsistenteException(
                    "Esiste gia' una richiesta di cancellazione attiva per questo account.");
        }

        richiestaCancellazioneRepository.save(new RichiestaCancellazione(utente));
    }

    /**
     * pre: reporterId &lt;&gt; dto.segnalatoId  and  dto.motivazione.size() &gt; 0
     * post: exists s | s.segnalante.id = reporterId and s.segnalato.id = dto.segnalatoId and s.stato = APERTA
     * (ODD 2.1, RF1.9, UC_26)
     */
    @Transactional
    public void reportUser(Long reporterId, ReportUserDTO dto) {
        if (reporterId.equals(dto.segnalatoId())) {
            throw new RegolaDiDominioViolataException("Non e' possibile segnalare il proprio stesso profilo.");
        }
        if (dto.motivazione() == null || dto.motivazione().isBlank()) {
            throw new RegolaDiDominioViolataException("E' necessario indicare una motivazione per la segnalazione.");
        }

        Utente segnalante = utenteRepository.findById(reporterId)
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente segnalante non trovato."));
        Utente segnalato = utenteRepository.findById(dto.segnalatoId())
                .orElseThrow(() -> new UtenteNonTrovatoException("Utente segnalato non trovato."));

        segnalazioneRepository.save(new Segnalazione(segnalante, segnalato, dto.motivazione()));
    }

    /*
     * --- Misure anti-bruteforce (RNF2.6, UC_2.2) --------------------------------------------
     *
     * Non fanno parte dei contratti OCL di GestioneUtenti (ODD 2.1), che non modella *authenticate:
     * la verifica delle credenziali resta delegata alla filter chain di Spring Security (vedi
     * javadoc di classe). Questi tre metodi sono invocati da security.LoginAttemptListener, che
     * adatta gli eventi AuthenticationFailureBadCredentialsEvent/AuthenticationSuccessEvent
     * pubblicati da Spring Security dopo ogni tentativo di login (SecurityConfig collega
     * esplicitamente un DefaultAuthenticationEventPublisher all'ApplicationEventPublisher condiviso).
     */

    /**
     * pre: exists u | u.email = email
     * post: u.tentativiFalliti incrementato di 1; se la soglia e' raggiunta, u.bloccatoFino e'
     * impostato e viene pubblicato BruteForceLockoutEvent (email di sblocco, ODD 2.6).
     * (RNF2.6 - non un contratto OCL formale di ODD 2.1)
     *
     * Silenziosamente no-op se l'email non corrisponde a un account esistente: coerente con
     * requestPasswordReset, evita di rivelare l'esistenza di un account a un attaccante.
     */
    @Transactional
    public void registerFailedLoginAttempt(String email) {
        utenteRepository.findByEmail(email).ifPresent(utente -> {
            utente.registraTentativoFallito();
            if (utente.getTentativiFalliti() >= MAX_TENTATIVI_LOGIN_FALLITI) {
                String tokenSblocco = UUID.randomUUID().toString();
                utente.bloccaAccount(tokenSblocco, Instant.now().plus(DURATA_BLOCCO_MINUTI, ChronoUnit.MINUTES));
                eventPublisher.publishEvent(new BruteForceLockoutEvent(utente.getId(), utente.getEmail(), tokenSblocco));
            }
        });
    }

    /**
     * pre: exists u | u.email = email
     * post: u.tentativiFalliti = 0
     * (RNF2.6 - non un contratto OCL formale di ODD 2.1)
     */
    @Transactional
    public void registerSuccessfulLogin(String email) {
        utenteRepository.findByEmail(email).ifPresent(Utente::resetTentativiFalliti);
    }

    /**
     * pre: exists u | u.tokenSblocco = token
     * post: u.bloccatoFino = null and u.tentativiFalliti = 0 and u.tokenSblocco = null
     * (RNF2.6 - non un contratto OCL formale di ODD 2.1; sblocco anticipato via link email, UC_2.2)
     */
    @Transactional
    public void confirmAccountUnlock(String token) {
        Utente utente = utenteRepository.findByTokenSblocco(token)
                .orElseThrow(() -> new TokenNonValidoException("Il link di sblocco non e' valido."));

        utente.sbloccaAccount();
    }
}
