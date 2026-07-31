package com.motormindhub.Api.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.motormindhub.Api.security.exception.TroppiTentativiLoginException;
import io.github.bucket4j.Bucket;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

/**
 * Rate limit per email su /api/v1/auth/login, non per IP: il front-end chiama login tramite un
 * route handler server-side di Next.js (il refresh token opaco deve restare in un cookie httpOnly,
 * mai passare dal browser), quindi il backend vedrebbe sempre e solo l'IP del server Next, non
 * quello del chiamante reale - un limite per-IP qui o non farebbe nulla (soglia alta) o bloccherebbe
 * tutti gli utenti del sito insieme (soglia bassa, bucket condiviso da traffico legittimo
 * concorrente). Per email invece la soglia protegge l'account bersaglio indipendentemente da quanti
 * IP diversi un attaccante usa (credential stuffing distribuito), cosa che RNF2.6 (blocco
 * per-account dopo 5 tentativi falliti, cfr. GestioneUtenti.registerFailedLoginAttempt) non
 * copre da solo: qui si conta ogni tentativo, riuscito o no, non solo i falliti.
 *
 * Soglia (10/min di default) volutamente sopra i 5 tentativi falliti del lockout per-account, cosi'
 * da non scattare mai prima per un utente che sbaglia la password un paio di volte per errore di
 * battitura - è un livello aggiuntivo, non un rimpiazzo del lockout. Configurabile
 * (security.login-rate-limit.capacity-per-minute) perche' alcuni test di integrazione esistenti
 * (es. LoginLockoutIntegrationTest) fanno gia' legittimamente piu' login ravvicinati sulla stessa
 * email di test per esercitare RNF2.6: quella classe alza la soglia solo per se' via
 * @TestPropertySource, i test dedicati a questa classe la abbassano per verificarne il
 * comportamento. Deliberatamente NESSUN application.properties in src/test/resources per questo:
 * ombreggerebbe src/main/resources/application.properties sul classpath dei test invece di unirsi
 * ad esso, perdendo silenziosamente ogni altra proprieta' (datasource, JWT secret, ...).
 *
 * Cache Caffeine (non una mappa semplice): la chiave e' l'email presentata nella richiesta, quindi
 * interamente sotto controllo di chi chiama (un attaccante puo' inventarne quante ne vuole) - senza
 * scadenza la mappa crescerebbe senza limite. expireAfterAccess supera la finestra di refill (1
 * minuto): un bucket inattivo scade solo dopo essere gia' tornato pieno.
 */
@Component
public class LoginRateLimiter {

    private final int capacitaAlMinuto;

    private final Cache<String, Bucket> bucketPerEmail = Caffeine.newBuilder()
            .maximumSize(50_000)
            .expireAfterAccess(2, TimeUnit.MINUTES)
            .build();

    public LoginRateLimiter(@Value("${security.login-rate-limit.capacity-per-minute:10}") int capacitaAlMinuto) {
        this.capacitaAlMinuto = capacitaAlMinuto;
    }

    public void checkAndConsume(String email) {
        String chiave = email.trim().toLowerCase(Locale.ROOT);
        Bucket bucket = bucketPerEmail.get(chiave, key -> Bucket.builder()
                .addLimit(limit -> limit.capacity(capacitaAlMinuto).refillGreedy(capacitaAlMinuto, Duration.ofMinutes(1)))
                .build());

        if (!bucket.tryConsume(1)) {
            throw new TroppiTentativiLoginException(
                    "Troppi tentativi di login per questo account. Riprova tra qualche istante.");
        }
    }
}
