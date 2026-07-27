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
import com.motormindhub.Api.model.repository.ConteggioArticoliPerAutore;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Un test per ciascun contratto OCL di GestioneAutori (ODD 2.4): un caso verifica la
 * post-condizione quando la pre-condizione e' soddisfatta, uno o piu' casi verificano che la
 * violazione della pre-condizione sollevi l'eccezione applicativa attesa.
 */
@ExtendWith(MockitoExtension.class)
class GestioneAutoriTest {

    @Mock
    private InvitoAutoreRepository invitoAutoreRepository;
    @Mock
    private UtenteRepository utenteRepository;
    @Mock
    private ArticoloRepository articoloRepository;
    @Mock
    private CategoriaRepository categoriaRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private GestioneAutori gestioneAutori;

    @BeforeEach
    void setUp() {
        gestioneAutori = new GestioneAutori(invitoAutoreRepository, utenteRepository, articoloRepository,
                categoriaRepository, passwordEncoder, eventPublisher);
    }

    private static Utente utente(Long id, Ruolo ruolo) {
        Utente u = new Utente("Marco", "Verdi", "utente" + id + "@provider.it", "hash", null, null, true, null);
        ReflectionTestUtils.setField(u, "id", id);
        u.setRuolo(ruolo);
        u.setStato(StatoUtente.ATTIVO);
        return u;
    }

    private static InvitoAutore invito(Long id, String email, StatoInvito stato, Instant dataScadenza) {
        InvitoAutore i = new InvitoAutore("Giulia", "Rossi", email, Ruolo.AUTORE, "tok-" + id, dataScadenza);
        ReflectionTestUtils.setField(i, "id", id);
        if (stato == StatoInvito.ACCETTATO) {
            i.accetta();
        } else if (stato == StatoInvito.RIFIUTATO) {
            i.rifiuta();
        }
        return i;
    }

    private static Categoria categoria(Long id) {
        Categoria c = new Categoria("Manutenzione ordinaria", "descrizione", null);
        ReflectionTestUtils.setField(c, "id", id);
        return c;
    }

    private static Articolo articolo(Long id, Utente autore, Categoria categoria, StatoArticolo stato) {
        Articolo a = new Articolo(autore, "Candele di accensione", "Testo", categoria, "candele", null);
        ReflectionTestUtils.setField(a, "id", id);
        a.setStato(stato);
        return a;
    }

    // --- inviteAuthor ---------------------------------------------------

    @Test
    void inviteAuthor_creaInvitoInviatoEPubblicaEvento_quandoNessunInvitoAttivoNeUtenteEsistente() {
        InviteAuthorDTO dto = new InviteAuthorDTO("Giulia", "Rossi", "giulia@provider.it", Ruolo.AUTORE);
        when(invitoAutoreRepository.existsByEmailAndStato("giulia@provider.it", StatoInvito.INVIATO)).thenReturn(false);
        when(utenteRepository.existsByEmail("giulia@provider.it")).thenReturn(false);
        when(invitoAutoreRepository.save(any(InvitoAutore.class))).thenAnswer(inv -> {
            InvitoAutore salvato = inv.getArgument(0);
            ReflectionTestUtils.setField(salvato, "id", 1L);
            return salvato;
        });

        Long id = gestioneAutori.inviteAuthor(dto);

        assertThat(id).isEqualTo(1L);
        ArgumentCaptor<InvitoAutore> captor = ArgumentCaptor.forClass(InvitoAutore.class);
        verify(invitoAutoreRepository).save(captor.capture());
        assertThat(captor.getValue().getStato()).isEqualTo(StatoInvito.INVIATO);
        assertThat(captor.getValue().getRuoloProposto()).isEqualTo(Ruolo.AUTORE);
        verify(eventPublisher).publishEvent(any(AutoreInvitatoEvent.class));
    }

    @Test
    void inviteAuthor_lanciaEccezione_quandoInvitoAttivoGiaEsistente() {
        InviteAuthorDTO dto = new InviteAuthorDTO("Giulia", "Rossi", "giulia@provider.it", Ruolo.AUTORE);
        when(invitoAutoreRepository.existsByEmailAndStato("giulia@provider.it", StatoInvito.INVIATO)).thenReturn(true);

        assertThrows(InvitoGiaEsistenteException.class, () -> gestioneAutori.inviteAuthor(dto));
        verify(invitoAutoreRepository, never()).save(any());
    }

    @Test
    void inviteAuthor_lanciaEccezione_quandoRuoloNonValido() {
        InviteAuthorDTO dto = new InviteAuthorDTO("Giulia", "Rossi", "giulia@provider.it", Ruolo.ISCRITTO);

        assertThrows(RegolaDiDominioViolataException.class, () -> gestioneAutori.inviteAuthor(dto));
        verify(invitoAutoreRepository, never()).existsByEmailAndStato(any(), any());
    }

    @Test
    void inviteAuthor_lanciaEccezione_quandoEmailGiaRegistrataComeUtente() {
        InviteAuthorDTO dto = new InviteAuthorDTO("Giulia", "Rossi", "giulia@provider.it", Ruolo.AUTORE);
        when(invitoAutoreRepository.existsByEmailAndStato("giulia@provider.it", StatoInvito.INVIATO)).thenReturn(false);
        when(utenteRepository.existsByEmail("giulia@provider.it")).thenReturn(true);

        assertThrows(EmailGiaRegistrataException.class, () -> gestioneAutori.inviteAuthor(dto));
        verify(invitoAutoreRepository, never()).save(any());
    }

    // --- acceptInvite -----------------------------------------------------

    @Test
    void acceptInvite_creaUtenteAttivoEAccettaInvito_quandoTokenValido() {
        InvitoAutore invito = invito(1L, "giulia@provider.it", StatoInvito.INVIATO, Instant.now().plus(1, ChronoUnit.DAYS));
        when(invitoAutoreRepository.findByToken("tok-1")).thenReturn(Optional.of(invito));
        when(passwordEncoder.encode("Ahgeydg78LF!")).thenReturn("hash-sicuro");
        when(utenteRepository.save(any(Utente.class))).thenAnswer(inv -> {
            Utente salvato = inv.getArgument(0);
            ReflectionTestUtils.setField(salvato, "id", 42L);
            return salvato;
        });

        Long idUtente = gestioneAutori.acceptInvite("tok-1", new SetPasswordDTO("Ahgeydg78LF!"));

        assertThat(idUtente).isEqualTo(42L);
        assertThat(invito.getStato()).isEqualTo(StatoInvito.ACCETTATO);
        ArgumentCaptor<Utente> captor = ArgumentCaptor.forClass(Utente.class);
        verify(utenteRepository).save(captor.capture());
        assertThat(captor.getValue().getStato()).isEqualTo(StatoUtente.ATTIVO);
        assertThat(captor.getValue().getRuolo()).isEqualTo(Ruolo.AUTORE);
        assertThat(captor.getValue().getEmail()).isEqualTo("giulia@provider.it");
    }

    @Test
    void acceptInvite_lanciaEccezione_quandoTokenInesistente() {
        when(invitoAutoreRepository.findByToken("assente")).thenReturn(Optional.empty());

        assertThrows(InvitoNonTrovatoException.class,
                () -> gestioneAutori.acceptInvite("assente", new SetPasswordDTO("Ahgeydg78LF!")));
        verify(utenteRepository, never()).save(any());
    }

    @Test
    void acceptInvite_lanciaEccezione_quandoInvitoGiaAccettato() {
        InvitoAutore invito = invito(1L, "giulia@provider.it", StatoInvito.ACCETTATO, Instant.now().plus(1, ChronoUnit.DAYS));
        when(invitoAutoreRepository.findByToken("tok-1")).thenReturn(Optional.of(invito));

        assertThrows(InvitoNonTrovatoException.class,
                () -> gestioneAutori.acceptInvite("tok-1", new SetPasswordDTO("Ahgeydg78LF!")));
    }

    @Test
    void acceptInvite_lanciaEccezione_quandoInvitoScaduto() {
        InvitoAutore invito = invito(1L, "giulia@provider.it", StatoInvito.INVIATO, Instant.now().minus(1, ChronoUnit.HOURS));
        when(invitoAutoreRepository.findByToken("tok-1")).thenReturn(Optional.of(invito));

        assertThrows(InvitoNonTrovatoException.class,
                () -> gestioneAutori.acceptInvite("tok-1", new SetPasswordDTO("Ahgeydg78LF!")));
    }

    // --- declineInvite -----------------------------------------------------

    @Test
    void declineInvite_rifiutaInvito_quandoStatoInviato() {
        InvitoAutore invito = invito(1L, "giulia@provider.it", StatoInvito.INVIATO, Instant.now().plus(1, ChronoUnit.DAYS));
        when(invitoAutoreRepository.findByToken("tok-1")).thenReturn(Optional.of(invito));

        gestioneAutori.declineInvite("tok-1");

        assertThat(invito.getStato()).isEqualTo(StatoInvito.RIFIUTATO);
    }

    @Test
    void declineInvite_consentito_ancheSeInvitoScaduto() {
        // declineInvite (ODD 2.4) verifica solo lo stato INVIATO, non la scadenza.
        InvitoAutore invito = invito(1L, "giulia@provider.it", StatoInvito.INVIATO, Instant.now().minus(1, ChronoUnit.HOURS));
        when(invitoAutoreRepository.findByToken("tok-1")).thenReturn(Optional.of(invito));

        gestioneAutori.declineInvite("tok-1");

        assertThat(invito.getStato()).isEqualTo(StatoInvito.RIFIUTATO);
    }

    @Test
    void declineInvite_lanciaEccezione_quandoTokenInesistente() {
        when(invitoAutoreRepository.findByToken("assente")).thenReturn(Optional.empty());

        assertThrows(InvitoNonTrovatoException.class, () -> gestioneAutori.declineInvite("assente"));
    }

    @Test
    void declineInvite_lanciaEccezione_quandoInvitoGiaProcessato() {
        InvitoAutore invito = invito(1L, "giulia@provider.it", StatoInvito.ACCETTATO, Instant.now().plus(1, ChronoUnit.DAYS));
        when(invitoAutoreRepository.findByToken("tok-1")).thenReturn(Optional.of(invito));

        assertThrows(InvitoNonTrovatoException.class, () -> gestioneAutori.declineInvite("tok-1"));
    }

    // --- removeAuthor -----------------------------------------------------

    @Test
    void removeAuthor_retrocedeAdIscrittoEMantieneArticoli_quandoMantieniArticoliTrue() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(autore));

        gestioneAutori.removeAuthor(1L, new RemoveAuthorPolicyDTO(true));

        assertThat(autore.getRuolo()).isEqualTo(Ruolo.ISCRITTO);
        verify(articoloRepository, never()).deleteByAutoreId(any());
    }

    @Test
    void removeAuthor_eliminaArticoli_quandoMantieniArticoliFalse() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(autore));

        gestioneAutori.removeAuthor(1L, new RemoveAuthorPolicyDTO(false));

        assertThat(autore.getRuolo()).isEqualTo(Ruolo.ISCRITTO);
        verify(articoloRepository).deleteByAutoreId(1L);
    }

    @Test
    void removeAuthor_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(AutoreNonTrovatoException.class, () -> gestioneAutori.removeAuthor(99L, new RemoveAuthorPolicyDTO(true)));
    }

    @Test
    void removeAuthor_lanciaEccezione_quandoUtenteNonEAutore() {
        Utente iscritto = utente(2L, Ruolo.ISCRITTO);
        when(utenteRepository.findById(2L)).thenReturn(Optional.of(iscritto));

        assertThrows(AutoreNonTrovatoException.class, () -> gestioneAutori.removeAuthor(2L, new RemoveAuthorPolicyDTO(true)));
    }

    // --- approveArticle -----------------------------------------------------

    @Test
    void approveArticle_pubblicaArticoloEPubblicaEvento_quandoInAttesaApprovazione() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo articolo = articolo(10L, autore, categoria(5L), StatoArticolo.IN_ATTESA_APPROVAZIONE);
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(articolo));

        gestioneAutori.approveArticle(10L);

        assertThat(articolo.getStato()).isEqualTo(StatoArticolo.PUBBLICATO);
        ArgumentCaptor<ArticoloRecensitoEvent> captor = ArgumentCaptor.forClass(ArticoloRecensitoEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().approvato()).isTrue();
    }

    @Test
    void approveArticle_lanciaEccezione_quandoArticoloInesistente() {
        when(articoloRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ArticoloNonTrovatoException.class, () -> gestioneAutori.approveArticle(99L));
    }

    @Test
    void approveArticle_lanciaEccezione_quandoStatoNonInAttesa() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo bozza = articolo(10L, autore, null, StatoArticolo.BOZZA);
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(bozza));

        assertThrows(StatoArticoloNonValidoException.class, () -> gestioneAutori.approveArticle(10L));
    }

    // --- rejectArticle -----------------------------------------------------

    @Test
    void rejectArticle_rifiutaArticoloEPubblicaEvento_quandoInAttesaEMotivazionePresente() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo articolo = articolo(10L, autore, categoria(5L), StatoArticolo.IN_ATTESA_APPROVAZIONE);
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(articolo));

        gestioneAutori.rejectArticle(10L, new RejectionReasonDTO("Fonti non verificabili"));

        assertThat(articolo.getStato()).isEqualTo(StatoArticolo.RIFIUTATO);
        assertThat(articolo.getMotivazioneRifiuto()).isEqualTo("Fonti non verificabili");
        ArgumentCaptor<ArticoloRecensitoEvent> captor = ArgumentCaptor.forClass(ArticoloRecensitoEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().approvato()).isFalse();
    }

    @Test
    void rejectArticle_lanciaEccezione_quandoMotivazioneVuota() {
        assertThrows(RegolaDiDominioViolataException.class,
                () -> gestioneAutori.rejectArticle(10L, new RejectionReasonDTO("   ")));
        verify(articoloRepository, never()).findById(any());
    }

    @Test
    void rejectArticle_lanciaEccezione_quandoArticoloInesistente() {
        when(articoloRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ArticoloNonTrovatoException.class,
                () -> gestioneAutori.rejectArticle(99L, new RejectionReasonDTO("Motivazione valida")));
    }

    @Test
    void rejectArticle_lanciaEccezione_quandoStatoNonInAttesa() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo pubblicato = articolo(10L, autore, categoria(5L), StatoArticolo.PUBBLICATO);
        when(articoloRepository.findById(10L)).thenReturn(Optional.of(pubblicato));

        assertThrows(StatoArticoloNonValidoException.class,
                () -> gestioneAutori.rejectArticle(10L, new RejectionReasonDTO("Motivazione valida")));
    }

    // --- query: listAuthors -----------------------------------------------------

    @Test
    void listAuthors_restituisceAutoriConConteggioArticoli() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        when(utenteRepository.findByRuolo(Ruolo.AUTORE)).thenReturn(List.of(autore));
        ConteggioArticoliPerAutore conteggio = mock(ConteggioArticoliPerAutore.class);
        when(conteggio.getAutoreId()).thenReturn(1L);
        when(conteggio.getConteggio()).thenReturn(64L);
        when(articoloRepository.countByAutoreIdIn(List.of(1L))).thenReturn(List.of(conteggio));

        List<AuthorSummaryDTO> risultato = gestioneAutori.listAuthors();

        assertThat(risultato).hasSize(1);
        assertThat(risultato.get(0).numeroArticoli()).isEqualTo(64L);
        assertThat(risultato.get(0).stato()).isEqualTo(StatoUtente.ATTIVO);
    }

    @Test
    void listAuthors_restituisceZeroArticoli_quandoLAutoreNonHaNessunArticolo() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        when(utenteRepository.findByRuolo(Ruolo.AUTORE)).thenReturn(List.of(autore));
        when(articoloRepository.countByAutoreIdIn(List.of(1L))).thenReturn(List.of());

        List<AuthorSummaryDTO> risultato = gestioneAutori.listAuthors();

        assertThat(risultato).hasSize(1);
        assertThat(risultato.get(0).numeroArticoli()).isEqualTo(0L);
    }

    // --- query: getPendingArticles -----------------------------------------------------

    @Test
    void getPendingArticles_restituisceArticoliInAttesa() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        Articolo inAttesa = articolo(10L, autore, categoria(5L), StatoArticolo.IN_ATTESA_APPROVAZIONE);
        when(articoloRepository.findByStatoOrderByDataUltimoAggiornamentoDesc(StatoArticolo.IN_ATTESA_APPROVAZIONE))
                .thenReturn(List.of(inAttesa));

        List<PendingArticleDTO> risultato = gestioneAutori.getPendingArticles();

        assertThat(risultato).hasSize(1);
        assertThat(risultato.get(0).titolo()).isEqualTo("Candele di accensione");
        assertThat(risultato.get(0).categoriaNome()).isEqualTo("Manutenzione ordinaria");
    }

    // --- query: getManagerDashboardStats -----------------------------------------------------

    @Test
    void getManagerDashboardStats_aggregaContatoriECodaLimitata() {
        Utente autore = utente(1L, Ruolo.AUTORE);
        List<Articolo> inAttesa = List.of(
                articolo(10L, autore, categoria(5L), StatoArticolo.IN_ATTESA_APPROVAZIONE),
                articolo(11L, autore, categoria(5L), StatoArticolo.IN_ATTESA_APPROVAZIONE),
                articolo(12L, autore, categoria(5L), StatoArticolo.IN_ATTESA_APPROVAZIONE),
                articolo(13L, autore, categoria(5L), StatoArticolo.IN_ATTESA_APPROVAZIONE)
        );
        when(articoloRepository.countByStato(StatoArticolo.PUBBLICATO)).thenReturn(312L);
        when(articoloRepository.countByStato(StatoArticolo.IN_ATTESA_APPROVAZIONE)).thenReturn(4L);
        when(utenteRepository.countByRuoloAndStato(Ruolo.AUTORE, StatoUtente.ATTIVO)).thenReturn(18L);
        when(categoriaRepository.count()).thenReturn(86L);
        when(articoloRepository.findByStatoOrderByDataUltimoAggiornamentoDesc(StatoArticolo.IN_ATTESA_APPROVAZIONE))
                .thenReturn(inAttesa);

        ManagerDashboardStatsDTO stats = gestioneAutori.getManagerDashboardStats();

        assertThat(stats.articoliPubblicati()).isEqualTo(312L);
        assertThat(stats.inAttesaApprovazione()).isEqualTo(4L);
        assertThat(stats.autoriAttivi()).isEqualTo(18L);
        assertThat(stats.categorieTotali()).isEqualTo(86L);
        assertThat(stats.articoliInCoda()).hasSize(3); // anteprima limitata (mockup 29: "VEDI TUTTI")
    }
}
