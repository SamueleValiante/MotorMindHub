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
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.AdministrativeActionLogFiltersDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.MotivazioneSospensione;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.ReportResolutionDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.SuspensionDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.UserSearchCriteriaDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.ContenutiInSospesoException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.GestoreNonAutorizzatoException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.RegolaDiDominioViolataException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.RichiestaCancellazioneNonTrovataException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.SegnalazioneNonTrovataException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.StatoAccountNonValidoException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.UtenteNonTrovatoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Un test per ciascun contratto OCL di GestioneAmministrazioneUtenti (ODD 2.5): un caso verifica la
 * post-condizione quando la pre-condizione e' soddisfatta, uno o piu' casi verificano che la
 * violazione della pre-condizione sollevi l'eccezione applicativa attesa.
 */
@ExtendWith(MockitoExtension.class)
class GestioneAmministrazioneUtentiTest {

    @Mock
    private UtenteRepository utenteRepository;
    @Mock
    private SegnalazioneRepository segnalazioneRepository;
    @Mock
    private RichiestaCancellazioneRepository richiestaCancellazioneRepository;
    @Mock
    private ArticoloRepository articoloRepository;
    @Mock
    private LogAzioneAmministrativaRepository logAzioneAmministrativaRepository;
    @Mock
    private VisitaSessioneRepository visitaSessioneRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private GestioneAmministrazioneUtenti gestione;

    @BeforeEach
    void setUp() {
        gestione = new GestioneAmministrazioneUtenti(utenteRepository, segnalazioneRepository,
                richiestaCancellazioneRepository, articoloRepository, logAzioneAmministrativaRepository,
                visitaSessioneRepository, eventPublisher);
    }

    private static Utente utente(Long id, String email, StatoUtente stato) {
        return utente(id, email, stato, Ruolo.ISCRITTO);
    }

    private static Utente utente(Long id, String email, StatoUtente stato, Ruolo ruolo) {
        Utente u = new Utente("Paolo", "Bianchi", email, "hash", null, null, true, null);
        ReflectionTestUtils.setField(u, "id", id);
        u.setStato(stato);
        ReflectionTestUtils.setField(u, "ruolo", ruolo);
        return u;
    }

    private static Segnalazione segnalazione(Long id, Utente segnalante, Utente segnalato,
                                              String motivazione, StatoSegnalazione stato) {
        Segnalazione s = new Segnalazione(segnalante, segnalato, motivazione);
        ReflectionTestUtils.setField(s, "id", id);
        s.setStato(stato);
        return s;
    }

    private static RichiestaCancellazione richiesta(Long id, Utente utente, StatoRichiestaCancellazione stato) {
        RichiestaCancellazione r = new RichiestaCancellazione(utente);
        ReflectionTestUtils.setField(r, "id", id);
        r.setStato(stato);
        return r;
    }

    // --- suspendAccount ------------------------------------------------------

    @Test
    void suspendAccount_sospendeEPubblicaEventoELoggaAzione_quandoAccountAttivoEMotivazioneValida() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));
        SuspensionDTO dto = new SuspensionDTO(MotivazioneSospensione.CONTENUTI_INAPPROPRIATI, null, 30);

        gestione.suspendAccount(1L, dto, 2L);

        assertThat(utente.getStato()).isEqualTo(StatoUtente.SOSPESO);
        ArgumentCaptor<LogAzioneAmministrativa> logCaptor = ArgumentCaptor.forClass(LogAzioneAmministrativa.class);
        verify(logAzioneAmministrativaRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getTipoAzione()).isEqualTo(TipoAzioneAmministrativa.SOSPENSIONE);
        assertThat(logCaptor.getValue().getUtenteTarget()).isEqualTo(utente);
        ArgumentCaptor<AccountSospesoEvent> eventCaptor = ArgumentCaptor.forClass(AccountSospesoEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().motivazione()).isEqualTo(MotivazioneSospensione.CONTENUTI_INAPPROPRIATI.getEtichetta());
        assertThat(eventCaptor.getValue().durataGiorni()).isEqualTo(30);
    }

    @Test
    void suspendAccount_includeLeNoteAggiuntiveNelTestoDellEvento_quandoPresenti() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));
        SuspensionDTO dto = new SuspensionDTO(MotivazioneSospensione.ALTRO, "Foto profilo con contenuti non pertinenti", null);

        gestione.suspendAccount(1L, dto, 2L);

        ArgumentCaptor<AccountSospesoEvent> eventCaptor = ArgumentCaptor.forClass(AccountSospesoEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().motivazione())
                .isEqualTo(MotivazioneSospensione.ALTRO.getEtichetta() + " - Foto profilo con contenuti non pertinenti");
    }

    @Test
    void suspendAccount_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtenteNonTrovatoException.class,
                () -> gestione.suspendAccount(99L, new SuspensionDTO(MotivazioneSospensione.SPAM, null, null), 2L));
    }

    @Test
    void suspendAccount_lanciaEccezione_quandoAccountNonAttivo() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.SOSPESO);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        assertThrows(StatoAccountNonValidoException.class,
                () -> gestione.suspendAccount(1L, new SuspensionDTO(MotivazioneSospensione.SPAM, null, null), 2L));
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void suspendAccount_lanciaEccezione_quandoMotivazioneNulla() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        assertThrows(RegolaDiDominioViolataException.class,
                () -> gestione.suspendAccount(1L, new SuspensionDTO(null, null, null), 2L));
        assertThat(utente.getStato()).isEqualTo(StatoUtente.ATTIVO);
    }

    @Test
    void suspendAccount_lanciaEccezione_quandoUnGestoreProvaASospendereUnAltroGestore() {
        Utente bersaglio = utente(1L, "gestore-bersaglio@provider.it", StatoUtente.ATTIVO, Ruolo.GESTORE_UTENTI);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(bersaglio));

        assertThrows(GestoreNonAutorizzatoException.class,
                () -> gestione.suspendAccount(1L, new SuspensionDTO(MotivazioneSospensione.SPAM, null, null), 2L));
        assertThat(bersaglio.getStato()).isEqualTo(StatoUtente.ATTIVO);
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void suspendAccount_permetteAutoSospensione_quandoUnGestoreSospendeSeStesso() {
        Utente sestesso = utente(1L, "gestore@provider.it", StatoUtente.ATTIVO, Ruolo.GESTORE_UTENTI);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(sestesso));

        gestione.suspendAccount(1L, new SuspensionDTO(MotivazioneSospensione.SPAM, null, null), 1L);

        assertThat(sestesso.getStato()).isEqualTo(StatoUtente.SOSPESO);
        verify(eventPublisher).publishEvent(any(AccountSospesoEvent.class));
    }

    // --- reactivateAccount ----------------------------------------------------

    @Test
    void reactivateAccount_riattivaEPubblicaEventoELoggaAzione_quandoAccountSospeso() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.SOSPESO);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        gestione.reactivateAccount(1L);

        assertThat(utente.getStato()).isEqualTo(StatoUtente.ATTIVO);
        ArgumentCaptor<LogAzioneAmministrativa> logCaptor = ArgumentCaptor.forClass(LogAzioneAmministrativa.class);
        verify(logAzioneAmministrativaRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getTipoAzione()).isEqualTo(TipoAzioneAmministrativa.RIATTIVAZIONE);
        verify(eventPublisher).publishEvent(any(AccountRiattivatoEvent.class));
    }

    @Test
    void reactivateAccount_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtenteNonTrovatoException.class, () -> gestione.reactivateAccount(99L));
    }

    @Test
    void reactivateAccount_lanciaEccezione_quandoAccountNonSospeso() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        assertThrows(StatoAccountNonValidoException.class, () -> gestione.reactivateAccount(1L));
        verify(eventPublisher, never()).publishEvent(any());
    }

    // --- resolveReport ----------------------------------------------------------

    @Test
    void resolveReport_impostaInGestioneEPubblicaRichiestaModifica_quandoNuovoStatoInGestione() {
        Utente segnalante = utente(1L, "marco@provider.it", StatoUtente.ATTIVO);
        Utente segnalato = utente(2L, "paolo@provider.it", StatoUtente.ATTIVO);
        Segnalazione segnalazione = segnalazione(10L, segnalante, segnalato, "Nome offensivo", StatoSegnalazione.APERTA);
        when(segnalazioneRepository.findById(10L)).thenReturn(Optional.of(segnalazione));

        gestione.resolveReport(10L, new ReportResolutionDTO(StatoSegnalazione.IN_GESTIONE));

        assertThat(segnalazione.getStato()).isEqualTo(StatoSegnalazione.IN_GESTIONE);
        ArgumentCaptor<RichiestaModificaProfiloEvent> captor = ArgumentCaptor.forClass(RichiestaModificaProfiloEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().utenteId()).isEqualTo(2L);
    }

    @Test
    void resolveReport_archiviaSenzaPubblicareEventi_quandoNuovoStatoArchiviata() {
        Utente segnalante = utente(1L, "marco@provider.it", StatoUtente.ATTIVO);
        Utente segnalato = utente(2L, "paolo@provider.it", StatoUtente.ATTIVO);
        Segnalazione segnalazione = segnalazione(10L, segnalante, segnalato, "Nome offensivo", StatoSegnalazione.IN_GESTIONE);
        when(segnalazioneRepository.findById(10L)).thenReturn(Optional.of(segnalazione));

        gestione.resolveReport(10L, new ReportResolutionDTO(StatoSegnalazione.ARCHIVIATA));

        assertThat(segnalazione.getStato()).isEqualTo(StatoSegnalazione.ARCHIVIATA);
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void resolveReport_lanciaEccezione_quandoSegnalazioneInesistente() {
        when(segnalazioneRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(SegnalazioneNonTrovataException.class,
                () -> gestione.resolveReport(99L, new ReportResolutionDTO(StatoSegnalazione.ARCHIVIATA)));
    }

    @Test
    void resolveReport_lanciaEccezione_quandoSegnalazioneGiaArchiviata() {
        Utente segnalante = utente(1L, "marco@provider.it", StatoUtente.ATTIVO);
        Utente segnalato = utente(2L, "paolo@provider.it", StatoUtente.ATTIVO);
        Segnalazione segnalazione = segnalazione(10L, segnalante, segnalato, "Nome offensivo", StatoSegnalazione.ARCHIVIATA);
        when(segnalazioneRepository.findById(10L)).thenReturn(Optional.of(segnalazione));

        assertThrows(SegnalazioneNonTrovataException.class,
                () -> gestione.resolveReport(10L, new ReportResolutionDTO(StatoSegnalazione.ARCHIVIATA)));
    }

    @Test
    void resolveReport_lanciaEccezione_quandoNuovoStatoNonValido() {
        Utente segnalante = utente(1L, "marco@provider.it", StatoUtente.ATTIVO);
        Utente segnalato = utente(2L, "paolo@provider.it", StatoUtente.ATTIVO);
        Segnalazione segnalazione = segnalazione(10L, segnalante, segnalato, "Nome offensivo", StatoSegnalazione.APERTA);
        when(segnalazioneRepository.findById(10L)).thenReturn(Optional.of(segnalazione));

        assertThrows(RegolaDiDominioViolataException.class,
                () -> gestione.resolveReport(10L, new ReportResolutionDTO(StatoSegnalazione.APERTA)));
    }

    // --- processAccountDeletion --------------------------------------------------

    @Test
    void processAccountDeletion_anonimizzaUtenteECompletaRichiesta_quandoNessunContenutoInSospeso() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        RichiestaCancellazione richiesta = richiesta(5L, utente, StatoRichiestaCancellazione.IN_CODA);
        when(richiestaCancellazioneRepository.findById(5L)).thenReturn(Optional.of(richiesta));
        when(articoloRepository.existsByAutoreIdAndStato(1L, StatoArticolo.IN_ATTESA_APPROVAZIONE)).thenReturn(false);

        gestione.processAccountDeletion(5L);

        assertThat(richiesta.getStato()).isEqualTo(StatoRichiestaCancellazione.COMPLETATA);
        assertThat(utente.getEmail()).isNotEqualTo("paolo@provider.it");
        assertThat(utente.getStato()).isEqualTo(StatoUtente.CANCELLATO);
        ArgumentCaptor<LogAzioneAmministrativa> logCaptor = ArgumentCaptor.forClass(LogAzioneAmministrativa.class);
        verify(logAzioneAmministrativaRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getTipoAzione()).isEqualTo(TipoAzioneAmministrativa.CANCELLAZIONE);
        ArgumentCaptor<AccountCancellatoEvent> eventCaptor = ArgumentCaptor.forClass(AccountCancellatoEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().emailUtente()).isEqualTo("paolo@provider.it");
    }

    @Test
    void processAccountDeletion_lanciaEccezione_quandoRichiestaInesistente() {
        when(richiestaCancellazioneRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RichiestaCancellazioneNonTrovataException.class, () -> gestione.processAccountDeletion(99L));
    }

    @Test
    void processAccountDeletion_lanciaEccezione_quandoRichiestaGiaElaborata() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        RichiestaCancellazione richiesta = richiesta(5L, utente, StatoRichiestaCancellazione.COMPLETATA);
        when(richiestaCancellazioneRepository.findById(5L)).thenReturn(Optional.of(richiesta));

        assertThrows(RichiestaCancellazioneNonTrovataException.class, () -> gestione.processAccountDeletion(5L));
    }

    @Test
    void processAccountDeletion_lanciaEccezione_quandoContenutiInSospeso() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        RichiestaCancellazione richiesta = richiesta(5L, utente, StatoRichiestaCancellazione.IN_CODA);
        when(richiestaCancellazioneRepository.findById(5L)).thenReturn(Optional.of(richiesta));
        when(articoloRepository.existsByAutoreIdAndStato(1L, StatoArticolo.IN_ATTESA_APPROVAZIONE)).thenReturn(true);

        assertThrows(ContenutiInSospesoException.class, () -> gestione.processAccountDeletion(5L));
        assertThat(richiesta.getStato()).isEqualTo(StatoRichiestaCancellazione.IN_CODA);
        assertThat(utente.getEmail()).isEqualTo("paolo@provider.it");
    }

    // --- exportUserDataAssisted --------------------------------------------------

    @Test
    void exportUserDataAssisted_loggaAzioneEPubblicaEvento_quandoUtenteEsiste() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        gestione.exportUserDataAssisted(1L);

        ArgumentCaptor<LogAzioneAmministrativa> logCaptor = ArgumentCaptor.forClass(LogAzioneAmministrativa.class);
        verify(logAzioneAmministrativaRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getTipoAzione()).isEqualTo(TipoAzioneAmministrativa.ESPORTAZIONE);
        verify(eventPublisher).publishEvent(any(DataExportReadyEvent.class));
    }

    @Test
    void exportUserDataAssisted_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtenteNonTrovatoException.class, () -> gestione.exportUserDataAssisted(99L));
        verify(logAzioneAmministrativaRepository, never()).save(any());
    }

    // --- query di sola lettura ----------------------------------------------------

    @Test
    void getUserManagementDashboard_restituisceIContatoriAggregati() {
        when(utenteRepository.countByStatoNot(StatoUtente.CANCELLATO)).thenReturn(42L);
        when(segnalazioneRepository.countByStato(StatoSegnalazione.APERTA)).thenReturn(3L);
        when(richiestaCancellazioneRepository.countByStato(StatoRichiestaCancellazione.IN_CODA)).thenReturn(2L);

        var dashboard = gestione.getUserManagementDashboard();

        assertThat(dashboard.utentiRegistrati()).isEqualTo(42L);
        assertThat(dashboard.segnalazioniAperte()).isEqualTo(3L);
        assertThat(dashboard.richiesteCancellazioneInCoda()).isEqualTo(2L);
    }

    @Test
    void searchUsers_mappaGliUtentiTrovatiInDTO() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        when(utenteRepository.search("paolo", null)).thenReturn(List.of(utente));

        var risultati = gestione.searchUsers(new UserSearchCriteriaDTO("paolo", null));

        assertThat(risultati).hasSize(1);
        assertThat(risultati.get(0).email()).isEqualTo("paolo@provider.it");
    }

    @ParameterizedTest
    @EnumSource(Ruolo.class)
    void searchUsers_popolaIlRuoloPerCiascunValoreDellEnum(Ruolo ruolo) {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO, ruolo);
        when(utenteRepository.search("paolo", null)).thenReturn(List.of(utente));

        var risultati = gestione.searchUsers(new UserSearchCriteriaDTO("paolo", null));

        assertThat(risultati).hasSize(1);
        assertThat(risultati.get(0).ruolo()).isEqualTo(ruolo);
    }

    @Test
    void getReportsQueue_mappaLeSegnalazioniInDTO() {
        Utente segnalante = utente(1L, "marco@provider.it", StatoUtente.ATTIVO);
        Utente segnalato = utente(2L, "paolo@provider.it", StatoUtente.ATTIVO);
        Segnalazione segnalazione = segnalazione(10L, segnalante, segnalato, "Nome offensivo", StatoSegnalazione.APERTA);
        when(segnalazioneRepository.findAllByOrderByDataCreazioneDesc()).thenReturn(List.of(segnalazione));

        var risultati = gestione.getReportsQueue();

        assertThat(risultati).hasSize(1);
        assertThat(risultati.get(0).segnalatoId()).isEqualTo(2L);
        assertThat(risultati.get(0).motivazione()).isEqualTo("Nome offensivo");
    }

    @Test
    void getDeletionRequestsQueue_mappaLeRichiesteInDTO() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        RichiestaCancellazione richiesta = richiesta(5L, utente, StatoRichiestaCancellazione.IN_CODA);
        when(richiestaCancellazioneRepository.findAllByOrderByDataRichiestaDesc()).thenReturn(List.of(richiesta));

        var risultati = gestione.getDeletionRequestsQueue();

        assertThat(risultati).hasSize(1);
        assertThat(risultati.get(0).utenteId()).isEqualTo(1L);
        assertThat(risultati.get(0).stato()).isEqualTo(StatoRichiestaCancellazione.IN_CODA);
    }

    @Test
    void getAdministrativeActionLog_filtraPerQueryLibera() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        LogAzioneAmministrativa log1 = new LogAzioneAmministrativa(utente, TipoAzioneAmministrativa.SOSPENSIONE, "Sospensione account (30 gg)");
        LogAzioneAmministrativa log2 = new LogAzioneAmministrativa(utente, TipoAzioneAmministrativa.RIATTIVAZIONE, "Riattivazione account");
        when(logAzioneAmministrativaRepository.findByFiltro(null)).thenReturn(List.of(log1, log2));

        var risultati = gestione.getAdministrativeActionLog(new AdministrativeActionLogFiltersDTO(null, "riattivazione"));

        assertThat(risultati).hasSize(1);
        assertThat(risultati.get(0).tipoAzione()).isEqualTo(TipoAzioneAmministrativa.RIATTIVAZIONE);
    }

    // --- registraVisita --------------------------------------------------------

    @ParameterizedTest
    @EnumSource(value = Ruolo.class, names = {"AUTORE", "MANAGER_AUTORI", "GESTORE_UTENTI"})
    void registraVisita_nonRegistraNulla_quandoRuoloRedazionale(Ruolo ruolo) {
        Optional<String> risultato = gestione.registraVisita(null, ruolo);

        assertThat(risultato).isEmpty();
        verify(visitaSessioneRepository, never()).save(any());
    }

    @Test
    void registraVisita_registraNuovaSessioneComeGuest_quandoRuoloNullo() {
        Optional<String> risultato = gestione.registraVisita(null, null);

        assertThat(risultato).isPresent();
        ArgumentCaptor<VisitaSessione> captor = ArgumentCaptor.forClass(VisitaSessione.class);
        verify(visitaSessioneRepository).save(captor.capture());
        assertThat(captor.getValue().getSessioneId()).isEqualTo(risultato.get());
        assertThat(captor.getValue().getTipo()).isEqualTo(TipoVisitatore.GUEST);
    }

    @Test
    void registraVisita_registraNuovaSessioneComeIscritto_quandoRuoloIscritto() {
        Optional<String> risultato = gestione.registraVisita(null, Ruolo.ISCRITTO);

        assertThat(risultato).isPresent();
        ArgumentCaptor<VisitaSessione> captor = ArgumentCaptor.forClass(VisitaSessione.class);
        verify(visitaSessioneRepository).save(captor.capture());
        assertThat(captor.getValue().getTipo()).isEqualTo(TipoVisitatore.ISCRITTO);
    }

    @Test
    void registraVisita_nonRegistraNulla_quandoSessioneGiaRegistrata() {
        when(visitaSessioneRepository.existsBySessioneId("sessione-esistente")).thenReturn(true);

        Optional<String> risultato = gestione.registraVisita("sessione-esistente", Ruolo.ISCRITTO);

        assertThat(risultato).isEmpty();
        verify(visitaSessioneRepository, never()).save(any());
    }

    @Test
    void registraVisita_nonCercaLaSessione_quandoSessioneIdEsistenteAssente() {
        // Nessun cookie in ingresso: nessuna lookup di deduplica da fare, si registra direttamente.
        Optional<String> risultato = gestione.registraVisita(null, Ruolo.ISCRITTO);

        assertThat(risultato).isPresent();
        verify(visitaSessioneRepository, never()).existsBySessioneId(any());
    }

    // --- getVisiteStatistiche ---------------------------------------------------

    @Test
    void getVisiteStatistiche_mappaIConteggiAggregatiInDTO() {
        ConteggioVisite conteggio = mock(ConteggioVisite.class);
        when(conteggio.getOggi()).thenReturn(10L);
        when(conteggio.getSettimana()).thenReturn(40L);
        when(conteggio.getMese()).thenReturn(120L);
        when(conteggio.getAnno()).thenReturn(900L);
        when(conteggio.getTotale()).thenReturn(950L);
        when(visitaSessioneRepository.aggregaConteggi(any(), any(), any(), any())).thenReturn(conteggio);

        var statistiche = gestione.getVisiteStatistiche();

        assertThat(statistiche.oggi()).isEqualTo(10L);
        assertThat(statistiche.settimana()).isEqualTo(40L);
        assertThat(statistiche.mese()).isEqualTo(120L);
        assertThat(statistiche.anno()).isEqualTo(900L);
        assertThat(statistiche.totale()).isEqualTo(950L);
    }

    // --- confiniPeriodo (calcolo puro, isolato dal wall-clock) ------------------

    private static final ZoneId ROMA = ZoneId.of("Europe/Rome");

    @Test
    void confiniPeriodo_calcolaICorrettiInizioPeriodo_casoBaseMetaSettimana() {
        var confini = GestioneAmministrazioneUtenti.confiniPeriodo(LocalDate.of(2026, 8, 12), ROMA);

        assertThat(confini.inizioGiorno()).isEqualTo(LocalDate.of(2026, 8, 12).atStartOfDay(ROMA).toInstant());
        assertThat(confini.inizioSettimana()).isEqualTo(LocalDate.of(2026, 8, 10).atStartOfDay(ROMA).toInstant());
        assertThat(confini.inizioMese()).isEqualTo(LocalDate.of(2026, 8, 1).atStartOfDay(ROMA).toInstant());
        assertThat(confini.inizioAnno()).isEqualTo(LocalDate.of(2026, 1, 1).atStartOfDay(ROMA).toInstant());
    }

    @Test
    void confiniPeriodo_inizioSettimanaCoincideConOggi_quandoOggiELunedi() {
        LocalDate lunedi = LocalDate.of(2026, 8, 10);
        assertThat(lunedi.getDayOfWeek()).isEqualTo(DayOfWeek.MONDAY);

        var confini = GestioneAmministrazioneUtenti.confiniPeriodo(lunedi, ROMA);

        assertThat(confini.inizioSettimana()).isEqualTo(confini.inizioGiorno());
    }

    @Test
    void confiniPeriodo_inizioMeseCoincideConOggi_quandoOggiEIlPrimoDelMese() {
        var confini = GestioneAmministrazioneUtenti.confiniPeriodo(LocalDate.of(2026, 8, 1), ROMA);

        assertThat(confini.inizioMese()).isEqualTo(confini.inizioGiorno());
    }

    @Test
    void confiniPeriodo_inizioSettimanaRicadeNellAnnoPrecedente_quandoOggiEIl1GennaioDiGiovedi() {
        LocalDate primoGennaio = LocalDate.of(2026, 1, 1);
        assertThat(primoGennaio.getDayOfWeek()).isEqualTo(DayOfWeek.THURSDAY);

        var confini = GestioneAmministrazioneUtenti.confiniPeriodo(primoGennaio, ROMA);

        assertThat(confini.inizioAnno()).isEqualTo(confini.inizioGiorno()).isEqualTo(confini.inizioMese());
        assertThat(confini.inizioSettimana()).isEqualTo(LocalDate.of(2025, 12, 29).atStartOfDay(ROMA).toInstant());
    }

    @Test
    void confiniPeriodo_gestisceCorrettamenteIlCambioOraLegale_inizioMarzo() {
        var prima = GestioneAmministrazioneUtenti.confiniPeriodo(LocalDate.of(2026, 3, 29), ROMA);
        var dopo = GestioneAmministrazioneUtenti.confiniPeriodo(LocalDate.of(2026, 3, 30), ROMA);

        // 29 marzo 2026, ultima domenica del mese: le lancette avanzano da 02:00 a 03:00, quel
        // giorno dura solo 23 ore in Europe/Rome.
        assertThat(Duration.between(prima.inizioGiorno(), dopo.inizioGiorno())).isEqualTo(Duration.ofHours(23));
    }

    @Test
    void confiniPeriodo_gestisceCorrettamenteIlCambioOraSolare_fineOttobre() {
        var prima = GestioneAmministrazioneUtenti.confiniPeriodo(LocalDate.of(2026, 10, 25), ROMA);
        var dopo = GestioneAmministrazioneUtenti.confiniPeriodo(LocalDate.of(2026, 10, 26), ROMA);

        // 25 ottobre 2026, ultima domenica del mese: le lancette arretrano da 03:00 a 02:00, quel
        // giorno dura 25 ore in Europe/Rome.
        assertThat(Duration.between(prima.inizioGiorno(), dopo.inizioGiorno())).isEqualTo(Duration.ofHours(25));
    }
}
