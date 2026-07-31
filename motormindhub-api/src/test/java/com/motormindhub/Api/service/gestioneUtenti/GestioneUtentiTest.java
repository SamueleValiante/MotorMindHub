package com.motormindhub.Api.service.gestioneUtenti;

import com.motormindhub.Api.events.BruteForceLockoutEvent;
import com.motormindhub.Api.events.DataExportReadyEvent;
import com.motormindhub.Api.events.PasswordResetRequestedEvent;
import com.motormindhub.Api.events.UtenteRegistratoEvent;
import com.motormindhub.Api.model.entity.RichiestaCancellazione;
import com.motormindhub.Api.model.entity.Ruolo;
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
import com.motormindhub.Api.service.gestioneUtenti.exception.TokenVerificaScadutoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.UtenteNonTrovatoException;
import com.motormindhub.Api.service.storage.CloudStorageService;
import com.motormindhub.Api.service.storage.ImageUploadValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Un test per ciascun contratto OCL di GestioneUtenti (ODD 2.1): un caso verifica la
 * post-condizione quando la pre-condizione e' soddisfatta, uno o piu' casi verificano che la
 * violazione della pre-condizione sollevi l'eccezione applicativa attesa.
 */
@ExtendWith(MockitoExtension.class)
class GestioneUtentiTest {

    @Mock
    private UtenteRepository utenteRepository;
    @Mock
    private TokenRecuperoPasswordRepository tokenRecuperoPasswordRepository;
    @Mock
    private SegnalazioneRepository segnalazioneRepository;
    @Mock
    private RichiestaCancellazioneRepository richiestaCancellazioneRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private ApplicationEventPublisher eventPublisher;
    @Mock
    private CloudStorageService cloudStorageService;
    @Mock
    private ImageUploadValidator imageUploadValidator;

    private GestioneUtenti gestioneUtenti;

    @BeforeEach
    void setUp() {
        gestioneUtenti = new GestioneUtenti(utenteRepository, tokenRecuperoPasswordRepository,
                segnalazioneRepository, richiestaCancellazioneRepository, passwordEncoder, eventPublisher,
                cloudStorageService, imageUploadValidator);
    }

    private static Utente utenteAttivo(Long id, String email) {
        Utente utente = new Utente("Marco", "Verdi", email, "hash-precedente", null, null, true, null);
        ReflectionTestUtils.setField(utente, "id", id);
        utente.setStato(StatoUtente.ATTIVO);
        return utente;
    }

    // --- registerUser ---------------------------------------------------

    @Test
    void registerUser_creaUtenteNonVerificatoEPubblicaEvento_quandoDatiValidi() {
        RegisterUserDTO dto = new RegisterUserDTO("Marco", "Verdi", "marco@provider.it",
                "Ahgeydg78LF!", null, "Appassionato di motori", true);
        when(utenteRepository.existsByEmail(dto.email())).thenReturn(false);
        when(passwordEncoder.encode(dto.password())).thenReturn("hashed-password");
        when(utenteRepository.save(any(Utente.class))).thenAnswer(invocation -> {
            Utente salvato = invocation.getArgument(0);
            ReflectionTestUtils.setField(salvato, "id", 42L);
            return salvato;
        });

        Long id = gestioneUtenti.registerUser(dto);

        assertThat(id).isEqualTo(42L);
        ArgumentCaptor<Utente> captor = ArgumentCaptor.forClass(Utente.class);
        verify(utenteRepository).save(captor.capture());
        Utente salvato = captor.getValue();
        assertThat(salvato.getEmail()).isEqualTo("marco@provider.it");
        assertThat(salvato.getStato()).isEqualTo(StatoUtente.NON_VERIFICATO);
        assertThat(salvato.getRuolo().name()).isEqualTo("ISCRITTO");
        assertThat(salvato.getDataScadenzaTokenVerifica()).isAfter(Instant.now());
        verify(eventPublisher).publishEvent(any(UtenteRegistratoEvent.class));
    }

    @Test
    void registerUser_lanciaEccezione_quandoEmailGiaRegistrata() {
        RegisterUserDTO dto = new RegisterUserDTO("Marco", "Verdi", "marco@provider.it",
                "Ahgeydg78LF!", null, null, true);
        when(utenteRepository.existsByEmail(dto.email())).thenReturn(true);

        assertThrows(EmailGiaRegistrataException.class, () -> gestioneUtenti.registerUser(dto));
        verify(utenteRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void registerUser_lanciaEccezione_quandoConsensoPrivacyMancante() {
        RegisterUserDTO dto = new RegisterUserDTO("Marco", "Verdi", "marco@provider.it",
                "Ahgeydg78LF!", null, null, false);

        assertThrows(RegolaDiDominioViolataException.class, () -> gestioneUtenti.registerUser(dto));
        verify(utenteRepository, never()).existsByEmail(anyString());
        verify(utenteRepository, never()).save(any());
    }

    // --- verifyEmail ------------------------------------------------------

    @Test
    void verifyEmail_attivaAccount_quandoTokenValidoEAccountNonVerificato() {
        Utente utente = new Utente("Marco", "Verdi", "marco@provider.it", "hash", null, null, true, "tok-123");
        utente.setDataScadenzaTokenVerifica(Instant.now().plus(1, ChronoUnit.HOURS));
        ReflectionTestUtils.setField(utente, "id", 1L);
        when(utenteRepository.findByTokenVerifica("tok-123")).thenReturn(Optional.of(utente));

        gestioneUtenti.verifyEmail("tok-123");

        assertThat(utente.getStato()).isEqualTo(StatoUtente.ATTIVO);
        assertThat(utente.getTokenVerifica()).isNull();
        assertThat(utente.getDataScadenzaTokenVerifica()).isNull();
    }

    @Test
    void verifyEmail_lanciaEccezione_quandoTokenInesistente() {
        when(utenteRepository.findByTokenVerifica("tok-invalido")).thenReturn(Optional.empty());

        assertThrows(TokenNonValidoException.class, () -> gestioneUtenti.verifyEmail("tok-invalido"));
    }

    @Test
    void verifyEmail_lanciaEccezione_quandoAccountGiaVerificato() {
        Utente utente = new Utente("Marco", "Verdi", "marco@provider.it", "hash", null, null, true, "tok-123");
        utente.setDataScadenzaTokenVerifica(Instant.now().plus(1, ChronoUnit.HOURS));
        utente.setStato(StatoUtente.ATTIVO);
        when(utenteRepository.findByTokenVerifica("tok-123")).thenReturn(Optional.of(utente));

        assertThrows(TokenNonValidoException.class, () -> gestioneUtenti.verifyEmail("tok-123"));
    }

    @Test
    void verifyEmail_lanciaEccezioneDedicata_quandoTokenScaduto() {
        Utente utente = new Utente("Marco", "Verdi", "marco@provider.it", "hash", null, null, true, "tok-scaduto");
        utente.setDataScadenzaTokenVerifica(Instant.now().minus(1, ChronoUnit.HOURS));
        when(utenteRepository.findByTokenVerifica("tok-scaduto")).thenReturn(Optional.of(utente));

        assertThrows(TokenVerificaScadutoException.class, () -> gestioneUtenti.verifyEmail("tok-scaduto"));
        assertThat(utente.getStato()).isEqualTo(StatoUtente.NON_VERIFICATO);
    }

    @Test
    void verifyEmail_lanciaEccezioneDedicata_quandoDataScadenzaAssente() {
        // simula un token emesso prima dell'introduzione della scadenza (dato legacy senza migrazione applicata a livello di test)
        Utente utente = new Utente("Marco", "Verdi", "marco@provider.it", "hash", null, null, true, "tok-legacy");
        when(utenteRepository.findByTokenVerifica("tok-legacy")).thenReturn(Optional.of(utente));

        assertThrows(TokenVerificaScadutoException.class, () -> gestioneUtenti.verifyEmail("tok-legacy"));
    }

    // --- requestPasswordReset ---------------------------------------------

    @Test
    void requestPasswordReset_creaTokenEPubblicaEvento_quandoAccountAttivo() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        when(utenteRepository.findByEmail("marco@provider.it")).thenReturn(Optional.of(utente));

        gestioneUtenti.requestPasswordReset("marco@provider.it");

        ArgumentCaptor<TokenRecuperoPassword> captor = ArgumentCaptor.forClass(TokenRecuperoPassword.class);
        verify(tokenRecuperoPasswordRepository).save(captor.capture());
        TokenRecuperoPassword token = captor.getValue();
        assertThat(token.isUtilizzato()).isFalse();
        assertThat(token.getDataScadenza()).isAfter(Instant.now());
        verify(eventPublisher).publishEvent(any(PasswordResetRequestedEvent.class));
    }

    @Test
    void requestPasswordReset_lanciaEccezione_quandoEmailInesistente() {
        when(utenteRepository.findByEmail("assente@provider.it")).thenReturn(Optional.empty());

        assertThrows(AccountNonAttivoException.class, () -> gestioneUtenti.requestPasswordReset("assente@provider.it"));
        verify(tokenRecuperoPasswordRepository, never()).save(any());
    }

    @Test
    void requestPasswordReset_lanciaEccezione_quandoAccountNonAttivo() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        utente.setStato(StatoUtente.NON_VERIFICATO);
        when(utenteRepository.findByEmail("marco@provider.it")).thenReturn(Optional.of(utente));

        assertThrows(AccountNonAttivoException.class, () -> gestioneUtenti.requestPasswordReset("marco@provider.it"));
    }

    // --- resetPassword ------------------------------------------------------

    @Test
    void resetPassword_aggiornaPasswordEInvalidaToken_quandoTokenValido() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        TokenRecuperoPassword token = new TokenRecuperoPassword(utente, "tok-reset",
                Instant.now().plus(1, ChronoUnit.HOURS));
        when(tokenRecuperoPasswordRepository.findByToken("tok-reset")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NuovaPassword78!")).thenReturn("nuovo-hash");

        gestioneUtenti.resetPassword("tok-reset", new NewPasswordDTO("NuovaPassword78!"));

        assertThat(utente.getPasswordHash()).isEqualTo("nuovo-hash");
        assertThat(token.isUtilizzato()).isTrue();
    }

    @Test
    void resetPassword_lanciaEccezione_quandoTokenInesistente() {
        when(tokenRecuperoPasswordRepository.findByToken("assente")).thenReturn(Optional.empty());

        assertThrows(TokenNonValidoException.class,
                () -> gestioneUtenti.resetPassword("assente", new NewPasswordDTO("NuovaPassword78!")));
    }

    @Test
    void resetPassword_lanciaEccezione_quandoTokenScaduto() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        TokenRecuperoPassword token = new TokenRecuperoPassword(utente, "tok-scaduto",
                Instant.now().minus(1, ChronoUnit.HOURS));
        when(tokenRecuperoPasswordRepository.findByToken("tok-scaduto")).thenReturn(Optional.of(token));

        assertThrows(TokenNonValidoException.class,
                () -> gestioneUtenti.resetPassword("tok-scaduto", new NewPasswordDTO("NuovaPassword78!")));
    }

    @Test
    void resetPassword_lanciaEccezione_quandoTokenGiaUtilizzato() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        TokenRecuperoPassword token = new TokenRecuperoPassword(utente, "tok-usato",
                Instant.now().plus(1, ChronoUnit.HOURS));
        token.setUtilizzato(true);
        when(tokenRecuperoPasswordRepository.findByToken("tok-usato")).thenReturn(Optional.of(token));

        assertThrows(TokenNonValidoException.class,
                () -> gestioneUtenti.resetPassword("tok-usato", new NewPasswordDTO("NuovaPassword78!")));
    }

    // --- updateProfile ------------------------------------------------------

    @Test
    void updateProfile_aggiornaDatiAnagrafici_quandoUtenteEsiste() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));
        UpdateProfileDTO dto = new UpdateProfileDTO("Marco", "Bianchi", "https://cdn/foto.jpg", "Motori aspirati");

        gestioneUtenti.updateProfile(1L, dto);

        assertThat(utente.getCognome()).isEqualTo("Bianchi");
        assertThat(utente.getFotoProfilo()).isEqualTo("https://cdn/foto.jpg");
        assertThat(utente.getBiografia()).isEqualTo("Motori aspirati");
    }

    @Test
    void updateProfile_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());
        UpdateProfileDTO dto = new UpdateProfileDTO("Marco", "Bianchi", null, null);

        assertThrows(UtenteNonTrovatoException.class, () -> gestioneUtenti.updateProfile(99L, dto));
    }

    @Test
    void updateProfile_lanciaEccezione_quandoBiografiaSuperaLimite() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));
        String biografiaTroppoLunga = "a".repeat(1001);
        UpdateProfileDTO dto = new UpdateProfileDTO("Marco", "Bianchi", null, biografiaTroppoLunga);

        assertThrows(RegolaDiDominioViolataException.class, () -> gestioneUtenti.updateProfile(1L, dto));
    }

    @Test
    void updateProfile_eliminaLaVecchiaFotoProfilo_quandoSostituitaConUnaDiversa() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        utente.setFotoProfilo("https://cdn/vecchia-foto.jpg");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));
        UpdateProfileDTO dto = new UpdateProfileDTO("Marco", "Bianchi", "https://cdn/nuova-foto.jpg", null);

        gestioneUtenti.updateProfile(1L, dto);

        verify(cloudStorageService).delete("https://cdn/vecchia-foto.jpg");
    }

    @Test
    void updateProfile_nonEliminaNulla_quandoLaFotoProfiloRestaInvariata() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        utente.setFotoProfilo("https://cdn/stessa-foto.jpg");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));
        UpdateProfileDTO dto = new UpdateProfileDTO("Marco", "Bianchi", "https://cdn/stessa-foto.jpg", null);

        gestioneUtenti.updateProfile(1L, dto);

        verify(cloudStorageService, never()).delete(anyString());
    }

    // --- uploadFotoProfilo ---------------------------------------------------

    @Test
    void uploadFotoProfilo_valida_eDelegaAlCloudStorageService() {
        MultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "dati".getBytes());
        when(cloudStorageService.upload(file, "profili")).thenReturn("https://cdn/nuova-foto.jpg");

        String url = gestioneUtenti.uploadFotoProfilo(file);

        verify(imageUploadValidator).validate(file, 2L * 1024 * 1024);
        assertThat(url).isEqualTo("https://cdn/nuova-foto.jpg");
    }

    // --- getPublicProfile (query) -------------------------------------------

    @Test
    void getPublicProfile_restituisceDatiPubblici_quandoUtenteEsiste() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        utente.setBiografia("Appassionato di motori");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        PublicProfileDTO profilo = gestioneUtenti.getPublicProfile(1L);

        assertThat(profilo.id()).isEqualTo(1L);
        assertThat(profilo.nome()).isEqualTo("Marco");
        assertThat(profilo.biografia()).isEqualTo("Appassionato di motori");
    }

    @Test
    void getPublicProfile_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtenteNonTrovatoException.class, () -> gestioneUtenti.getPublicProfile(99L));
    }

    // --- getCurrentUser (query) -------------------------------------------

    @Test
    void getCurrentUser_restituisceProfiloCompleto_quandoUtenteEsiste() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        utente.setRuolo(Ruolo.AUTORE);
        utente.setBiografia("Appassionato di motori");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        CurrentUserDTO corrente = gestioneUtenti.getCurrentUser(1L);

        assertThat(corrente.email()).isEqualTo("marco@provider.it");
        assertThat(corrente.ruolo()).isEqualTo(Ruolo.AUTORE);
        assertThat(corrente.stato()).isEqualTo(StatoUtente.ATTIVO);
        assertThat(corrente.dataRegistrazione()).isEqualTo(utente.getDataRegistrazione());
        assertThat(corrente.nome()).isEqualTo("Marco");
        assertThat(corrente.cognome()).isEqualTo("Verdi");
        assertThat(corrente.biografia()).isEqualTo("Appassionato di motori");
    }

    @Test
    void getCurrentUser_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtenteNonTrovatoException.class, () -> gestioneUtenti.getCurrentUser(99L));
    }

    // --- requestAccountDataExport --------------------------------------------

    @Test
    void requestAccountDataExport_pubblicaEvento_quandoAccountAttivo() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        gestioneUtenti.requestAccountDataExport(1L);

        verify(eventPublisher).publishEvent(any(DataExportReadyEvent.class));
    }

    @Test
    void requestAccountDataExport_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtenteNonTrovatoException.class, () -> gestioneUtenti.requestAccountDataExport(99L));
    }

    @Test
    void requestAccountDataExport_lanciaEccezione_quandoAccountNonAttivo() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        utente.setStato(StatoUtente.SOSPESO);
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));

        assertThrows(AccountNonAttivoException.class, () -> gestioneUtenti.requestAccountDataExport(1L));
        verify(eventPublisher, never()).publishEvent(any());
    }

    // --- requestAccountDeletion --------------------------------------------

    @Test
    void requestAccountDeletion_creaRichiestaInCoda_quandoNessunaRichiestaAttiva() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));
        when(richiestaCancellazioneRepository.existsByUtenteIdAndStatoNot(1L, StatoRichiestaCancellazione.RESPINTA))
                .thenReturn(false);

        gestioneUtenti.requestAccountDeletion(1L);

        ArgumentCaptor<RichiestaCancellazione> captor = ArgumentCaptor.forClass(RichiestaCancellazione.class);
        verify(richiestaCancellazioneRepository).save(captor.capture());
        assertThat(captor.getValue().getStato()).isEqualTo(StatoRichiestaCancellazione.IN_CODA);
        assertThat(captor.getValue().getUtente()).isEqualTo(utente);
    }

    @Test
    void requestAccountDeletion_lanciaEccezione_quandoUtenteInesistente() {
        when(utenteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtenteNonTrovatoException.class, () -> gestioneUtenti.requestAccountDeletion(99L));
    }

    @Test
    void requestAccountDeletion_lanciaEccezione_quandoRichiestaGiaAttiva() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(utente));
        when(richiestaCancellazioneRepository.existsByUtenteIdAndStatoNot(1L, StatoRichiestaCancellazione.RESPINTA))
                .thenReturn(true);

        assertThrows(RichiestaCancellazioneEsistenteException.class, () -> gestioneUtenti.requestAccountDeletion(1L));
        verify(richiestaCancellazioneRepository, never()).save(any());
    }

    // --- reportUser -----------------------------------------------------------

    @Test
    void reportUser_creaSegnalazioneAperta_quandoDatiValidi() {
        Utente segnalante = utenteAttivo(1L, "marco@provider.it");
        Utente segnalato = utenteAttivo(2L, "paolo@provider.it");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(segnalante));
        when(utenteRepository.findById(2L)).thenReturn(Optional.of(segnalato));
        ReportUserDTO dto = new ReportUserDTO(2L, "Nome utente offensivo");

        gestioneUtenti.reportUser(1L, dto);

        ArgumentCaptor<Segnalazione> captor = ArgumentCaptor.forClass(Segnalazione.class);
        verify(segnalazioneRepository).save(captor.capture());
        Segnalazione segnalazione = captor.getValue();
        assertThat(segnalazione.getSegnalante()).isEqualTo(segnalante);
        assertThat(segnalazione.getSegnalato()).isEqualTo(segnalato);
        assertThat(segnalazione.getStato().name()).isEqualTo("APERTA");
    }

    @Test
    void reportUser_lanciaEccezione_quandoAutoSegnalazione() {
        ReportUserDTO dto = new ReportUserDTO(1L, "Motivazione qualsiasi");

        assertThrows(RegolaDiDominioViolataException.class, () -> gestioneUtenti.reportUser(1L, dto));
        verify(utenteRepository, never()).findById(any());
    }

    @Test
    void reportUser_lanciaEccezione_quandoMotivazioneVuota() {
        ReportUserDTO dto = new ReportUserDTO(2L, "   ");

        assertThrows(RegolaDiDominioViolataException.class, () -> gestioneUtenti.reportUser(1L, dto));
    }

    @Test
    void reportUser_lanciaEccezione_quandoUtenteSegnalatoInesistente() {
        Utente segnalante = utenteAttivo(1L, "marco@provider.it");
        when(utenteRepository.findById(1L)).thenReturn(Optional.of(segnalante));
        when(utenteRepository.findById(2L)).thenReturn(Optional.empty());
        ReportUserDTO dto = new ReportUserDTO(2L, "Motivazione qualsiasi");

        assertThrows(UtenteNonTrovatoException.class, () -> gestioneUtenti.reportUser(1L, dto));
        verify(segnalazioneRepository, never()).save(any());
    }

    // --- registerFailedLoginAttempt / registerSuccessfulLogin / confirmAccountUnlock (RNF2.6) ----

    @Test
    void registerFailedLoginAttempt_incrementaContatoreSenzaBloccare_quandoSottoSoglia() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        when(utenteRepository.findByEmail("marco@provider.it")).thenReturn(Optional.of(utente));

        gestioneUtenti.registerFailedLoginAttempt("marco@provider.it");

        assertThat(utente.getTentativiFalliti()).isEqualTo(1);
        assertThat(utente.isBloccato()).isFalse();
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void registerFailedLoginAttempt_bloccaAccountEPubblicaEvento_quandoSogliaRaggiunta() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        when(utenteRepository.findByEmail("marco@provider.it")).thenReturn(Optional.of(utente));

        for (int i = 0; i < 5; i++) {
            gestioneUtenti.registerFailedLoginAttempt("marco@provider.it");
        }

        assertThat(utente.getTentativiFalliti()).isEqualTo(5);
        assertThat(utente.isBloccato()).isTrue();
        assertThat(utente.getTokenSblocco()).isNotBlank();
        verify(eventPublisher).publishEvent(any(BruteForceLockoutEvent.class));
    }

    @Test
    void registerFailedLoginAttempt_nonLanciaEccezioneNePubblicaEventi_quandoEmailInesistente() {
        when(utenteRepository.findByEmail("assente@provider.it")).thenReturn(Optional.empty());

        gestioneUtenti.registerFailedLoginAttempt("assente@provider.it");

        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void registerSuccessfulLogin_azzeraContatoreTentativiFalliti() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        utente.registraTentativoFallito();
        utente.registraTentativoFallito();
        when(utenteRepository.findByEmail("marco@provider.it")).thenReturn(Optional.of(utente));

        gestioneUtenti.registerSuccessfulLogin("marco@provider.it");

        assertThat(utente.getTentativiFalliti()).isEqualTo(0);
    }

    @Test
    void confirmAccountUnlock_sbloccaAccount_quandoTokenValido() {
        Utente utente = utenteAttivo(1L, "marco@provider.it");
        utente.bloccaAccount("tok-sblocco", Instant.now().plus(15, ChronoUnit.MINUTES));
        when(utenteRepository.findByTokenSblocco("tok-sblocco")).thenReturn(Optional.of(utente));

        gestioneUtenti.confirmAccountUnlock("tok-sblocco");

        assertThat(utente.isBloccato()).isFalse();
        assertThat(utente.getTentativiFalliti()).isEqualTo(0);
        assertThat(utente.getTokenSblocco()).isNull();
    }

    @Test
    void confirmAccountUnlock_lanciaEccezione_quandoTokenInesistente() {
        when(utenteRepository.findByTokenSblocco("assente")).thenReturn(Optional.empty());

        assertThrows(TokenNonValidoException.class, () -> gestioneUtenti.confirmAccountUnlock("assente"));
    }
}
