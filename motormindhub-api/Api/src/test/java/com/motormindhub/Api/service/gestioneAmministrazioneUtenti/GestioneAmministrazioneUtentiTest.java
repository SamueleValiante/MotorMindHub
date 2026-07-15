package com.motormindhub.Api.service.gestioneAmministrazioneUtenti;

import com.motormindhub.Api.events.AccountCancellatoEvent;
import com.motormindhub.Api.events.AccountRiattivatoEvent;
import com.motormindhub.Api.events.AccountSospesoEvent;
import com.motormindhub.Api.events.DataExportReadyEvent;
import com.motormindhub.Api.events.RichiestaModificaProfiloEvent;
import com.motormindhub.Api.model.entity.LogAzioneAmministrativa;
import com.motormindhub.Api.model.entity.RichiestaCancellazione;
import com.motormindhub.Api.model.entity.Segnalazione;
import com.motormindhub.Api.model.entity.StatoArticolo;
import com.motormindhub.Api.model.entity.StatoRichiestaCancellazione;
import com.motormindhub.Api.model.entity.StatoSegnalazione;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.TipoAzioneAmministrativa;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.ArticoloRepository;
import com.motormindhub.Api.model.repository.LogAzioneAmministrativaRepository;
import com.motormindhub.Api.model.repository.RichiestaCancellazioneRepository;
import com.motormindhub.Api.model.repository.SegnalazioneRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.AdministrativeActionLogFiltersDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.ReportResolutionDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.SuspensionDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto.UserSearchCriteriaDTO;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.ContenutiInSospesoException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.RegolaDiDominioViolataException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.RichiestaCancellazioneNonTrovataException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.SegnalazioneNonTrovataException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.StatoAccountNonValidoException;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.UtenteNonTrovatoException;
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
    private ApplicationEventPublisher eventPublisher;

    private GestioneAmministrazioneUtenti gestione;

    @BeforeEach
    void setUp() {
        gestione = new GestioneAmministrazioneUtenti(utenteRepository, segnalazioneRepository,
                richiestaCancellazioneRepository, articoloRepository, logAzioneAmministrativaRepository, eventPublisher);
    }

    private static Utente utente(Long id, String email, StatoUtente stato) {
        Utente u = new Utente("Paolo", "Bianchi", email, "hash", null, null, true, null);
        ReflectionTestUtils.setField(u, "id", id);
        u.setStato(stato);
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
        SuspensionDTO dto = new SuspensionDTO("Contenuti inappropriati", 30);

        gestione.suspendAccount(1L, dto);

        assertThat(utente.getStato()).isEqualTo(StatoUtente.SOSPESO);
        ArgumentCaptor<LogAzioneAmministrativa> logCaptor = ArgumentCaptor.forClass(LogAzioneAmministrativa.class);
        verify(logAzioneAmministrativaRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getTipoAzione()).isEqualTo(TipoAzioneAmministrativa.SOSPENSIONE);
        assertThat(logCaptor.getValue().getUtenteTarget()).isEqualTo(utente);
        ArgumentCaptor<AccountSospesoEvent> eventCaptor = ArgumentCaptor.forClass(AccountSospesoEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().motivazione()).isEqualTo("Contenuti inappropriati");
        assertThat(eventCaptor.getValue().durataGiorni()).isEqualTo(30);
    }

    @Test
    void suspendAccount_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtenteNonTrovatoException.class,
                () -> gestione.suspendAccount(99L, new SuspensionDTO("Motivo", null)));
    }

    @Test
    void suspendAccount_lanciaEccezione_quandoAccountNonAttivo() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.SOSPESO);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        assertThrows(StatoAccountNonValidoException.class,
                () -> gestione.suspendAccount(1L, new SuspensionDTO("Motivo", null)));
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void suspendAccount_lanciaEccezione_quandoMotivazioneVuota() {
        Utente utente = utente(1L, "paolo@provider.it", StatoUtente.ATTIVO);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        assertThrows(RegolaDiDominioViolataException.class,
                () -> gestione.suspendAccount(1L, new SuspensionDTO("   ", null)));
        assertThat(utente.getStato()).isEqualTo(StatoUtente.ATTIVO);
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
}
