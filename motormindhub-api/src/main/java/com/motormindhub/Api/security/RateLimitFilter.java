package com.motormindhub.Api.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.PathContainer;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Rate limiting per IP sugli endpoint pubblici (permitAll in SecurityConfig, cfr. ENDPOINT_PUBBLICI/
 * ENDPOINT_PUBBLICI_SOLO_LETTURA/ARTICOLO_DETTAGLIO_PUBBLICO) diversi da /api/v1/auth/**: login ha un
 * limite dedicato per email (LoginRateLimiter) - protegge l'account bersaglio anche da credential
 * stuffing distribuito su piu' IP, cosa che un limite per-IP non fermerebbe comunque, dato che il
 * front-end chiama /auth/login tramite un route handler server-side di Next.js (refresh token in
 * cookie httpOnly) e il backend vedrebbe sempre e solo l'IP di quel server, non quello reale del
 * chiamante. refresh e logout restano volutamente esclusi da qualunque rate limit qui: la reuse
 * detection gia' esistente in RefreshTokenService.rotate() e' la difesa primaria contro l'abuso di
 * un refresh token anche rubato (un riuso dopo la rotation revoca l'intera famiglia di token),
 * un limite aggiuntivo sarebbe ridondante rispetto a un meccanismo gia' piu' forte.
 *
 * Due tier per IP: permissivo per la lettura pubblica (ricerca/dettaglio articoli, categorie,
 * profilo pubblico) e per scritture pubbliche a basso rischio/costo (registrazione di una visita,
 * RF3.1/UC_28) e stretto per le azioni una tantum piu' costose o sensibili (registrazione,
 * verifica email, sblocco account, recupero/reset password, risposta a un invito). La soglia
 * permissiva e' stata verificata contro il flusso reale di Esplora Articoli (force-dynamic, RSC):
 * un giro completo con piu' cambi di filtro/ordinamento/pagina e alcune aperture di dettaglio resta
 * a circa un terzo del limite anche concentrato in un solo minuto.
 *
 * Le due capacita' sono configurabili (security.rate-limit.permissive-capacity-per-minute /
 * strict-capacity-per-minute, cfr. SecurityConfig.rateLimitFilter) e non piu' costanti fisse: la
 * suite e2e (Playwright, cfr. motormindhub-web/e2e) genera facilmente piu' di 60 GET /categorie o
 * /articoli al minuto anche in esecuzione seriale (workers:1, nessuna concorrenza) semplicemente
 * per il numero di file che condividono lo stesso backend/IP - non e' un caso limite raro, e'
 * successo ed e' stato isolato con una riproduzione minimale fuori da Playwright (un client Node
 * sequenziale, nessuna concorrenza, fallisce deterministicamente alla 61-esima richiesta). L'ambiente
 * e2e (CI e locale) imposta le soglie molto piu' alte via env var; i default restano quelli di
 * produzione. Deliberatamente NON un'esclusione per IP: fragile (quale IP esattamente, cosa succede
 * se l'ambiente CI cambia) e rischia di restare un'eccezione dimenticata - una soglia esplicita e
 * tracciabile e' preferibile.
 *
 * Bucket in cache Caffeine, non una mappa semplice: la chiave e' l'IP del chiamante, quindi di
 * cardinalita' potenzialmente grande e in parte sotto controllo di chi genera le richieste (un
 * attaccante puo' presentarsi con IP diversi) - senza scadenza la mappa crescerebbe senza limite.
 * expireAfterAccess e' maggiore della finestra di refill (1 minuto): un bucket inattivo scade solo
 * dopo essere gia' tornato pieno, quindi l'eviction non concede capacita' extra rispetto a lasciarlo
 * semplicemente rabboccare.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final PathPatternParser PARSER = new PathPatternParser();

    private final int permissivoCapacitaAlMinuto;
    private final int strettoCapacitaAlMinuto;

    private static final List<Endpoint> ENDPOINT_PERMISSIVI = List.of(
            Endpoint.of(HttpMethod.GET, "/api/v1/articoli"),
            Endpoint.of(HttpMethod.GET, "/api/v1/articoli/{articleId:[0-9]+}"),
            Endpoint.of(HttpMethod.GET, "/api/v1/categorie"),
            Endpoint.of(HttpMethod.GET, "/api/v1/categorie/**"),
            Endpoint.of(HttpMethod.GET, "/api/v1/utenti/{userId}/profilo-pubblico"),
            // Scrittura ma a basso rischio/costo (registrazione di una visita, RF3.1/UC_28): non
            // giustifica il tier stretto riservato ad azioni sensibili o costose one-shot.
            Endpoint.of(HttpMethod.POST, "/api/v1/visite"));

    private static final List<Endpoint> ENDPOINT_STRETTI = List.of(
            Endpoint.of(HttpMethod.POST, "/api/v1/utenti/registrazione"),
            Endpoint.of(HttpMethod.GET, "/api/v1/utenti/verifica-email"),
            Endpoint.of(HttpMethod.GET, "/api/v1/utenti/sblocco-account"),
            Endpoint.of(HttpMethod.POST, "/api/v1/utenti/password/recupero"),
            Endpoint.of(HttpMethod.POST, "/api/v1/utenti/password/reset"),
            Endpoint.of(HttpMethod.POST, "/api/v1/autori/inviti/{token}/accetta"),
            Endpoint.of(HttpMethod.POST, "/api/v1/autori/inviti/{token}/rifiuta"));

    private final Cache<String, Bucket> bucketPermissivi = nuovaCache();
    private final Cache<String, Bucket> bucketStretti = nuovaCache();

    public RateLimitFilter(int permissivoCapacitaAlMinuto, int strettoCapacitaAlMinuto) {
        this.permissivoCapacitaAlMinuto = permissivoCapacitaAlMinuto;
        this.strettoCapacitaAlMinuto = strettoCapacitaAlMinuto;
    }

    private static Cache<String, Bucket> nuovaCache() {
        return Caffeine.newBuilder()
                .maximumSize(50_000)
                .expireAfterAccess(2, TimeUnit.MINUTES)
                .build();
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (matches(ENDPOINT_STRETTI, request)) {
            if (!consenti(bucketStretti, strettoCapacitaAlMinuto, request, response)) {
                return;
            }
        } else if (matches(ENDPOINT_PERMISSIVI, request)) {
            if (!consenti(bucketPermissivi, permissivoCapacitaAlMinuto, request, response)) {
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean matches(List<Endpoint> endpoints, HttpServletRequest request) {
        return endpoints.stream().anyMatch(endpoint -> endpoint.matches(request));
    }

    private boolean consenti(Cache<String, Bucket> cache, int capacitaAlMinuto, HttpServletRequest request,
                              HttpServletResponse response) throws IOException {
        String ip = request.getRemoteAddr();
        Bucket bucket = cache.get(ip, key -> nuovoBucket(capacitaAlMinuto));

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            return true;
        }

        long attesaSecondi = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000L);
        response.setHeader("Retry-After", String.valueOf(attesaSecondi));
        JsonErrorResponseWriter.scrivi(response, HttpStatus.TOO_MANY_REQUESTS.value(), "Too Many Requests",
                "Troppe richieste da questo indirizzo IP. Riprova tra qualche istante.");
        return false;
    }

    private static Bucket nuovoBucket(int capacitaAlMinuto) {
        return Bucket.builder()
                .addLimit(limit -> limit.capacity(capacitaAlMinuto).refillGreedy(capacitaAlMinuto, Duration.ofMinutes(1)))
                .build();
    }

    private record Endpoint(HttpMethod method, PathPattern pattern) {

        static Endpoint of(HttpMethod method, String pattern) {
            return new Endpoint(method, PARSER.parse(pattern));
        }

        boolean matches(HttpServletRequest request) {
            if (!method.name().equals(request.getMethod())) {
                return false;
            }
            return pattern.matches(PathContainer.parsePath(request.getRequestURI()));
        }
    }
}
