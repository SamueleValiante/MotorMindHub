package com.motormindhub.Api.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Attivato quando manca un'autenticazione valida su un endpoint protetto (nessun token, token
 * malformato o scaduto): senza questo bean, Spring Security ricade sul default
 * Http403ForbiddenEntryPoint, indistinguibile lato client da un 403 per permessi insufficienti
 * (@PreAuthorize fallito con utente autenticato, gestito invece da RestAccessDeniedHandler).
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                          AuthenticationException authException) throws IOException {
        JsonErrorResponseWriter.scrivi(response, HttpStatus.UNAUTHORIZED.value(), "Unauthorized",
                "Autenticazione richiesta per accedere a questa risorsa.");
    }
}
