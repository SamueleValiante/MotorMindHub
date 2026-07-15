package com.motormindhub.Api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFISSO_BEARER = "Bearer ";

    // Scritto a mano (niente ObjectMapper) perche' questo filtro gira prima del DispatcherServlet,
    // quindi fuori dalla portata di GlobalExceptionHandler: l'unico ObjectMapper esposto come bean da
    // Spring in questo progetto (Spring Boot 4 / Jackson 3, tools.jackson.databind.ObjectMapper) non
    // e' compatibile con com.fasterxml.jackson.databind.ObjectMapper (Jackson 2, usato altrove ad es.
    // da JwtTokenProvider/jjwt-jackson) - iniettarlo qui aggiungerebbe un secondo ObjectMapper solo per
    // un corpo JSON statico di tre campi, senza alcun beneficio.
    private static final String CORPO_NON_AUTORIZZATO =
            "{\"status\":401,\"error\":\"Unauthorized\",\"messages\":[\"Account sospeso o bloccato.\"]}";

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, UserDetailsServiceImpl userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith(PREFISSO_BEARER)) {
            String token = header.substring(PREFISSO_BEARER.length());

            if (jwtTokenProvider.isTokenValido(token)) {
                String email = jwtTokenProvider.getEmailFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // Lo stato account viene riletto dal DB ad ogni richiesta (loadUserByUsername sopra):
                // un token gia' emesso non deve restare valido se l'account e' stato sospeso o bloccato
                // (RNF2.6) nel frattempo, altrimenti la sospensione non avrebbe effetto fino alla
                // scadenza naturale del token nonostante lo stato in DB sia gia' cambiato.
                if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
                    scriviRispostaNonAutorizzata(response);
                    return;
                }

                var authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private void scriviRispostaNonAutorizzata(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(CORPO_NON_AUTORIZZATO);
    }
}
