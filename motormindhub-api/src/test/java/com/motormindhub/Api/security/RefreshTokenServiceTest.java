package com.motormindhub.Api.security;

import com.motormindhub.Api.model.entity.RefreshToken;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.RefreshTokenRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.security.exception.RefreshTokenNonValidoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Non esiste un contratto OCL per RefreshTokenService (infrastruttura trasversale, non un
 * sottosistema applicativo con un proprio ODD): ogni test verifica direttamente il comportamento
 * atteso (generazione, rotation, revoca) descritto nella javadoc dei metodi.
 */
@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    private static final long DURATA_ORE = 3;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private UtenteRepository utenteRepository;

    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, utenteRepository, DURATA_ORE);
    }

    private static Utente utente(Long id, StatoUtente stato) {
        Utente u = new Utente("Marco", "Verdi", "marco@provider.it", "hash", null, null, true, null);
        ReflectionTestUtils.setField(u, "id", id);
        u.setStato(stato);
        return u;
    }

    // --- generate ------------------------------------------------------------

    @Test
    void generate_restituisceTokenCasualeEPersisteSoloLHash() {
        Utente utente = utente(1L, StatoUtente.ATTIVO);
        when(utenteRepository.getReferenceById(1L)).thenReturn(utente);

        String rawToken = refreshTokenService.generate(1L);

        assertThat(rawToken).isNotBlank();
        assertThat(rawToken).doesNotContain("="); // Base64 URL-safe senza padding

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken salvato = captor.getValue();
        assertThat(salvato.getTokenHash()).isNotEqualTo(rawToken);
        assertThat(salvato.getTokenHash()).hasSize(64); // SHA-256 esadecimale
        assertThat(salvato.getUtente()).isEqualTo(utente);
        assertThat(salvato.getDataScadenza()).isCloseTo(Instant.now().plus(DURATA_ORE, ChronoUnit.HOURS),
                within(5, ChronoUnit.SECONDS));
        assertThat(salvato.isRevocato()).isFalse();
    }

    @Test
    void generate_produceTokenDiversiAOgniChiamata() {
        when(utenteRepository.getReferenceById(1L)).thenReturn(utente(1L, StatoUtente.ATTIVO));

        String primo = refreshTokenService.generate(1L);
        String secondo = refreshTokenService.generate(1L);

        assertThat(primo).isNotEqualTo(secondo);
    }

    // --- rotate ----------------------------------------------------------------

    @Test
    void rotate_revocaIlVecchioTokenERestituisceLUtente_quandoTokenValidoEAccountAttivo() {
        Utente utente = utente(1L, StatoUtente.ATTIVO);
        RefreshToken token = new RefreshToken(utente, "hash-qualsiasi", Instant.now().plus(1, ChronoUnit.DAYS));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        Utente risultato = refreshTokenService.rotate("token-grezzo");

        assertThat(risultato).isEqualTo(utente);
        assertThat(token.isRevocato()).isTrue();
    }

    @Test
    void rotate_lanciaEccezione_quandoTokenInesistente() {
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThrows(RefreshTokenNonValidoException.class, () -> refreshTokenService.rotate("token-inesistente"));
    }

    @Test
    void rotate_lanciaEccezioneSenzaRevocareLaFamiglia_quandoTokenScadutoMaMaiRevocato() {
        Utente utente = utente(1L, StatoUtente.ATTIVO);
        RefreshToken token = new RefreshToken(utente, "hash-qualsiasi", Instant.now().minus(1, ChronoUnit.DAYS));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        assertThrows(RefreshTokenNonValidoException.class, () -> refreshTokenService.rotate("token-scaduto"));
        // Scadenza naturale, non riuso: non deve innescare la revoca dell'intera famiglia.
        verify(refreshTokenRepository, never()).revocaTuttiPerUtente(any());
    }

    @Test
    void rotate_revocaLIntereFamigliaDiTokenDellUtente_quandoIlTokenPresentatoEraGiaStatoRevocato() {
        Utente utente = utente(1L, StatoUtente.ATTIVO);
        RefreshToken token = new RefreshToken(utente, "hash-qualsiasi", Instant.now().plus(1, ChronoUnit.DAYS));
        token.revoca();
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        assertThrows(RefreshTokenNonValidoException.class, () -> refreshTokenService.rotate("token-gia-usato"));
        // Riuso rilevato (RefreshTokenService.rotate, javadoc): revoca l'intera famiglia dell'utente,
        // non solo rifiuta la richiesta corrente.
        verify(refreshTokenRepository).revocaTuttiPerUtente(1L);
    }

    @Test
    void rotate_lanciaEccezioneMaRevocaComunqueIlToken_quandoAccountNonPiuAttivo() {
        Utente utente = utente(1L, StatoUtente.SOSPESO);
        RefreshToken token = new RefreshToken(utente, "hash-qualsiasi", Instant.now().plus(1, ChronoUnit.DAYS));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        assertThrows(RefreshTokenNonValidoException.class, () -> refreshTokenService.rotate("token-account-sospeso"));
        assertThat(token.isRevocato()).isTrue();
    }

    // --- revoke ------------------------------------------------------------------

    @Test
    void revoke_marcaIlTokenComeRevocato_quandoEsiste() {
        Utente utente = utente(1L, StatoUtente.ATTIVO);
        RefreshToken token = new RefreshToken(utente, "hash-qualsiasi", Instant.now().plus(1, ChronoUnit.DAYS));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        refreshTokenService.revoke("token-da-revocare");

        assertThat(token.isRevocato()).isTrue();
    }

    @Test
    void revoke_nonLanciaEccezione_quandoTokenInesistente() {
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        refreshTokenService.revoke("token-inesistente");

        verify(refreshTokenRepository, never()).save(any());
    }

    // --- finestra scorrevole (sliding window) ---------------------------------

    /**
     * Nessuna logica nuova per la sessione "scorrevole": e' la rotation gia' esistente
     * (rotate + generate, invocata dal client ad ogni refresh dell'access token) a produrre
     * l'effetto, dato che ogni generate() riparte da Instant.now() e non dalla scadenza
     * originale. Qui si simulano piu' cicli di refresh ravvicinati (distanza << DURATA_ORE) e si
     * verifica che ciascun nuovo token scada sempre a DURATA_ORE dal refresh che lo ha emesso,
     * non dalla scadenza del token originale - la sessione resta quindi attiva a tempo
     * indeterminato finche' l'utente/client continua a effettuare refresh entro la finestra.
     */
    @Test
    void refreshRipetutiRavvicinati_mantengonoLaScadenzaSempreADurataOreDalPiuRecente_sessioneScorrevole() {
        Utente utente = utente(1L, StatoUtente.ATTIVO);
        when(utenteRepository.getReferenceById(1L)).thenReturn(utente);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        String rawToken = refreshTokenService.generate(1L);
        verify(refreshTokenRepository, times(1)).save(captor.capture());
        RefreshToken tokenCorrente = captor.getValue();

        for (int ciclo = 1; ciclo <= 5; ciclo++) {
            when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(tokenCorrente));

            Instant primaDelRefresh = Instant.now();
            Utente risultato = refreshTokenService.rotate(rawToken);
            assertThat(risultato).isEqualTo(utente);
            assertThat(tokenCorrente.isRevocato()).isTrue();

            rawToken = refreshTokenService.generate(1L);
            verify(refreshTokenRepository, times(ciclo + 1)).save(captor.capture());
            tokenCorrente = captor.getValue();

            // Ogni refresh riparte da "ora", non estende la scadenza originale: e' questo che
            // rende la finestra scorrevole (nessun tetto massimo sulla durata complessiva della
            // sessione, a differenza di una scadenza assoluta fissata al login).
            assertThat(tokenCorrente.getDataScadenza()).isCloseTo(primaDelRefresh.plus(DURATA_ORE, ChronoUnit.HOURS),
                    within(5, ChronoUnit.SECONDS));
            assertThat(tokenCorrente.isRevocato()).isFalse();
        }
    }
}
