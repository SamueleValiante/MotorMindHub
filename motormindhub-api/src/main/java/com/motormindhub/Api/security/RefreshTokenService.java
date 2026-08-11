package com.motormindhub.Api.security;

import com.motormindhub.Api.model.entity.RefreshToken;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.RefreshTokenRepository;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.security.exception.RefreshTokenNonValidoException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Emissione, rotation e revoca dei refresh token opachi (RNF9.2). A differenza di JwtTokenProvider
 * (access token, JWT auto-contenuto e stateless), qui il valore restituito al client e' un segreto
 * casuale senza struttura: solo il suo hash SHA-256 e' persistito (RefreshToken), mai il valore in
 * chiaro. SHA-256 (non BCrypt) e' una scelta deliberata: il token e' gia' ad alta entropia (256 bit
 * casuali generati da SecureRandom, non un segreto scelto dall'utente come una password), quindi non
 * serve un hash volutamente lento contro il brute-force - serve invece un hash deterministico che
 * permetta una lookup diretta per token_hash, cosa che BCrypt (salt casuale per invocazione) non
 * consente senza caricare e confrontare ogni token esistente.
 */
@Component
public class RefreshTokenService {

    private static final int TOKEN_BYTES = 32; // 256 bit di entropia
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final UtenteRepository utenteRepository;
    private final long durataOre;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                                UtenteRepository utenteRepository,
                                @Value("${security.refresh-token.expiration-hours}") long durataOre) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.utenteRepository = utenteRepository;
        this.durataOre = durataOre;
    }

    /**
     * Genera un nuovo refresh token per l'utente (es. al login) e ne persiste solo l'hash. Riceve
     * l'id, non l'entita' Utente: getReferenceById va invocato nella stessa transazione in cui viene
     * consumato (qui), non su un'entita'/proxy proveniente da un metodo @Transactional diverso -
     * stesso principio gia' applicato in CategoriaEliminataListener.
     */
    @Transactional
    public String generate(Long utenteId) {
        String rawToken = generaTokenCasuale();
        Instant scadenza = Instant.now().plus(durataOre, ChronoUnit.HOURS);
        refreshTokenRepository.save(new RefreshToken(utenteRepository.getReferenceById(utenteId), hash(rawToken), scadenza));
        return rawToken;
    }

    /**
     * Consuma un refresh token valido per la rotation (POST /api/v1/auth/refresh): lo revoca
     * immediatamente (un token gia' presentato non deve restare riutilizzabile, valido o meno il
     * risultato) e restituisce l'Utente associato perche' il chiamante possa emettere la nuova
     * coppia di token.
     *
     * Rilevamento del riuso (oltre la richiesta letterale, pratica consolidata per la rotation dei
     * refresh token - OWASP ASVS 3.3): se il token presentato esiste ma risulta gia' revocato (da
     * una rotation precedente o da un logout), non e' un semplice errore - e' il segnale che il
     * token e' stato copiato e sia il legittimo proprietario sia un possibile attaccante lo stanno
     * usando. In quel caso non basta rifiutare la richiesta corrente: se il token e' stato rubato,
     * l'attaccante potrebbe gia' aver completato una rotation legittima e possedere un token piu'
     * recente e ancora valido. Si revoca quindi l'intera famiglia di refresh token attivi
     * dell'utente, costringendo un nuovo login su tutte le sessioni. Un token scaduto ma mai
     * revocato non attiva questo comportamento: e' scadenza naturale, non un segnale di riuso.
     *
     * Il controllo di stato dell'account (ATTIVO, non bloccato) va oltre la richiesta letterale
     * ("scambia un refresh token valido per una nuova coppia") ma e' necessario per evitare che un
     * account sospeso o bloccato dopo il login (UC_23, RNF2.6) possa continuare a ottenere nuovi
     * access token tramite un refresh token emesso quando l'account era ancora attivo.
     */
    @Transactional
    public Utente rotate(String rawToken) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new RefreshTokenNonValidoException(
                        "Il refresh token non e' valido, e' scaduto o e' gia' stato utilizzato."));

        if (token.isRevocato()) {
            refreshTokenRepository.revocaTuttiPerUtente(token.getUtente().getId());
            throw new RefreshTokenNonValidoException(
                    "Il refresh token non e' valido, e' scaduto o e' gia' stato utilizzato.");
        }
        if (!token.isValido()) {
            throw new RefreshTokenNonValidoException(
                    "Il refresh token non e' valido, e' scaduto o e' gia' stato utilizzato.");
        }

        token.revoca();

        Utente utente = token.getUtente();
        if (utente.getStato() != StatoUtente.ATTIVO || utente.isBloccato()) {
            throw new RefreshTokenNonValidoException("L'account non e' piu' attivo.");
        }
        return utente;
    }

    /**
     * Invalidazione esplicita al logout (RNF9.2). Idempotente: nessun errore se il token non esiste
     * o e' gia' scaduto/revocato, coerente con la semantica "logout" (l'esito desiderato - nessun
     * refresh token valido residuo - e' comunque raggiunto).
     */
    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(RefreshToken::revoca);
    }

    private static String generaTokenCasuale() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 non disponibile.", e);
        }
    }
}
