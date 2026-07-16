package com.motormindhub.Api.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;

import java.io.IOException;

/**
 * Scrive un body di errore JSON minimale a mano (niente ObjectMapper): i chiamanti (filtro JWT,
 * AuthenticationEntryPoint, AccessDeniedHandler) girano prima o fuori dal DispatcherServlet, quindi
 * fuori dalla portata di GlobalExceptionHandler. L'unico ObjectMapper esposto come bean da Spring in
 * questo progetto (Spring Boot 4 / Jackson 3, tools.jackson.databind.ObjectMapper) non e' compatibile
 * con com.fasterxml.jackson.databind.ObjectMapper (Jackson 2, usato altrove es. da
 * JwtTokenProvider/jjwt-jackson): iniettarne un secondo qui, solo per un corpo JSON a un campo
 * variabile, non porterebbe benefici.
 */
final class JsonErrorResponseWriter {

    private JsonErrorResponseWriter() {
    }

    static void scrivi(HttpServletResponse response, int status, String error, String messaggio) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        String messaggioEscaped = messaggio.replace("\\", "\\\\").replace("\"", "\\\"");
        response.getWriter().write(
                "{\"status\":" + status + ",\"error\":\"" + error + "\",\"messages\":[\"" + messaggioEscaped + "\"]}");
    }
}
