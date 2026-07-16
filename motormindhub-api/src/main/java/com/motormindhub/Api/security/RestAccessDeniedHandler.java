package com.motormindhub.Api.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Attivato quando l'utente e' autenticato ma il ruolo non soddisfa @PreAuthorize: distinto da
 * RestAuthenticationEntryPoint, che copre invece l'assenza di autenticazione valida.
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                        AccessDeniedException accessDeniedException) throws IOException {
        JsonErrorResponseWriter.scrivi(response, HttpStatus.FORBIDDEN.value(), "Forbidden",
                "Permessi insufficienti per accedere a questa risorsa.");
    }
}
