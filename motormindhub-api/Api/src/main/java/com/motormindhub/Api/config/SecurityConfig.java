package com.motormindhub.Api.config;

import com.motormindhub.Api.security.JwtAuthenticationFilter;
import com.motormindhub.Api.security.JwtTokenProvider;
import com.motormindhub.Api.security.UserDetailsServiceImpl;
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

/**
 * Configurazione RBAC/JWT trasversale (SDD 3.4): non e' un sottosistema applicativo a se',
 * ma un livello cross-cutting applicato a tutti i sottosistemi (RNF9.5).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

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

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(ENDPOINT_PUBBLICI).permitAll()
                        .requestMatchers(HttpMethod.GET, ENDPOINT_PUBBLICI_SOLO_LETTURA).permitAll()
                        .requestMatchers(HttpMethod.GET, ARTICOLO_DETTAGLIO_PUBBLICO).permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
