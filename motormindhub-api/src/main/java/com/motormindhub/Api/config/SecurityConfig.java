package com.motormindhub.Api.config;

import com.motormindhub.Api.security.JwtAuthenticationFilter;
import com.motormindhub.Api.security.JwtTokenProvider;
import com.motormindhub.Api.security.RateLimitFilter;
import com.motormindhub.Api.security.RestAccessDeniedHandler;
import com.motormindhub.Api.security.RestAuthenticationEntryPoint;
import com.motormindhub.Api.security.UserDetailsServiceImpl;
import jakarta.servlet.DispatcherType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DefaultAuthenticationEventPublisher;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configurazione RBAC/JWT trasversale (SDD 3.4): non e' un sottosistema applicativo a se',
 * ma un livello cross-cutting applicato a tutti i sottosistemi (RNF9.5).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    // Path che espongono un unico metodo HTTP: permitAll sull'intero path e' sicuro.
    private static final String[] ENDPOINT_PUBBLICI = {
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/api/v1/utenti/registrazione",
            "/api/v1/utenti/verifica-email",
            "/api/v1/utenti/sblocco-account",
            "/api/v1/utenti/password/**",
            "/api/v1/utenti/*/profilo-pubblico",
            "/api/v1/autori/inviti/*/accetta",
            "/api/v1/autori/inviti/*/rifiuta",
            "/api/v1/visite",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    // GestioneCategorie espone sullo stesso path sia letture pubbliche (GET) sia scritture
    // riservate ad Autore/Manager Autori (POST/PUT/DELETE, RNF9.5): il permitAll va quindi
    // ristretto al solo metodo GET, altrimenti bypasserebbe anche le scritture a livello di filtro.
    private static final String[] ENDPOINT_PUBBLICI_SOLO_LETTURA = {
            "/api/v1/categorie",
            "/api/v1/categorie/**",
            "/api/v1/articoli"
    };

    // GestioneArticoli ha, sotto lo stesso prefisso, sotto-risorse private non numeriche
    // (/api/v1/articoli/me, /api/v1/articoli/salvataggi): un wildcard "/**" le esporrebbe
    // pubblicamente. Il vincolo regex sul path variable ammette solo id numerici, coerente con
    // @GetMapping("/{articleId:[0-9]+}") nel controller.
    private static final String ARTICOLO_DETTAGLIO_PUBBLICO = "/api/v1/articoli/{articleId:[0-9]+}";

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * L'AuthenticationEventPublisher e' collegato esplicitamente (anziche' affidarsi
     * all'autoconfigurazione di Spring Boot) perche' l'AuthenticationManager qui e' costruito a mano
     * tramite ProviderManager, non tramite AuthenticationManagerBuilder: senza questo collegamento
     * esplicito, AuthenticationFailureBadCredentialsEvent/AuthenticationSuccessEvent non verrebbero
     * mai pubblicati sull'ApplicationEventPublisher condiviso, e le misure anti-bruteforce di
     * RNF2.6 (LoginAttemptListener) non scatterebbero mai.
     */
    @Bean
    public AuthenticationManager authenticationManager(UserDetailsServiceImpl userDetailsService,
                                                         PasswordEncoder passwordEncoder,
                                                         ApplicationEventPublisher eventPublisher) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        org.springframework.security.authentication.ProviderManager providerManager =
                new org.springframework.security.authentication.ProviderManager(provider);
        providerManager.setAuthenticationEventPublisher(new DefaultAuthenticationEventPublisher(eventPublisher));
        return providerManager;
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider,
                                                             UserDetailsServiceImpl userDetailsService) {
        return new JwtAuthenticationFilter(jwtTokenProvider, userDetailsService);
    }

    /**
     * Soglie configurabili (cfr. RateLimitFilter): l'ambiente e2e (CI e locale) le alza
     * drasticamente via env var, senza toccare i default di produzione qui.
     */
    @Bean
    public RateLimitFilter rateLimitFilter(
            @Value("${security.rate-limit.permissive-capacity-per-minute:60}") int permissivoCapacitaAlMinuto,
            @Value("${security.rate-limit.strict-capacity-per-minute:8}") int strettoCapacitaAlMinuto) {
        return new RateLimitFilter(permissivoCapacitaAlMinuto, strettoCapacitaAlMinuto);
    }

    /**
     * Origin/i del front-end Next.js, configurabili (app.cors.allowed-origins, default
     * localhost:3000 per non rompere lo sviluppo locale) - elenco separato da virgole per
     * ammettere piu' origini contemporaneamente (es. un dominio Vercel temporaneo insieme a un
     * futuro dominio custom) senza ritoccare il codice una seconda volta. Credentials abilitate
     * perche' il front-end invia l'header Authorization (Bearer JWT) in richieste cross-origin.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") String allowedOrigins) {
        // TEMPORANEO - diagnostica CORS_ALLOWED_ORIGINS su Railway, da rimuovere una volta chiarito.
        // Le parentesi quadre rendono visibile a occhio uno spazio iniziale/finale nascosto nel
        // valore risolto.
        log.info("CORS allowed origins risolti: [{}]", allowedOrigins);

        CorsConfiguration configuration = new CorsConfiguration();
        // trim() su ciascun elemento: Spring confronta l'Origin per uguaglianza esatta di stringa,
        // uno spazio residuo attorno a una virgola o un a-capo finale (es. da un copia-incolla nella
        // dashboard di un provider di hosting) farebbe fallire silenziosamente ogni confronto - un
        // 403 indistinguibile da un valore completamente sbagliato. filter() scarta voci vuote da
        // un'eventuale virgola finale/doppia.
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter,
                                                     RateLimitFilter rateLimitFilter,
                                                     CorsConfigurationSource corsConfigurationSource,
                                                     RestAuthenticationEntryPoint authenticationEntryPoint,
                                                     RestAccessDeniedHandler accessDeniedHandler) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        // Il forward interno di Spring Boot verso /error (dispatch di tipo ERROR) ripassa
                        // per l'intera filter chain come una nuova richiesta: senza questa regola, per una
                        // richiesta originaria non autenticata su un endpoint permitAll che solleva
                        // un'eccezione non gestita, quel secondo passaggio finirebbe su anyRequest().authenticated()
                        // e verrebbe intercettato da RestAuthenticationEntryPoint - un 401 che maschera un 500
                        // reale. GlobalExceptionHandler.handleErroreInterno intercetta gia' la stragrande
                        // maggioranza dei casi prima che si arrivi a un dispatch verso /error; questa regola e'
                        // una seconda rete di sicurezza per cio' che sfugge a quel livello (es. eccezioni
                        // sollevate da un filtro anziche' da un controller).
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(ENDPOINT_PUBBLICI).permitAll()
                        .requestMatchers(HttpMethod.GET, ENDPOINT_PUBBLICI_SOLO_LETTURA).permitAll()
                        .requestMatchers(HttpMethod.GET, ARTICOLO_DETTAGLIO_PUBBLICO).permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class);

        return http.build();
    }
}
