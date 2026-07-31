package com.motormindhub.Api.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit test del filtro (nessun contesto Spring): le soglie sono costanti private della classe
 * (60/min permissivo, 8/min stretto), verificate qui esaurendo davvero il bucket invece di
 * duplicarle come costanti nel test - se cambiano in RateLimitFilter, il test si adatta.
 */
class RateLimitFilterTest {

    @Test
    void endpointStretto_vieneBloccatoConTooManyRequests_dopoLaSogliaEChiaveEIp() throws Exception {
        RateLimitFilter filtro = new RateLimitFilter();

        // Fino alla soglia: passa tutto (POST /api/v1/utenti/registrazione, tier stretto).
        int ultimaRisposta = -1;
        for (int i = 0; i < 8; i++) {
            ultimaRisposta = eseguiRichiesta(filtro, "POST", "/api/v1/utenti/registrazione", "10.0.0.1");
        }
        assertThat(ultimaRisposta).isEqualTo(200);

        // Il tentativo successivo, stesso IP, supera la soglia.
        assertThat(eseguiRichiesta(filtro, "POST", "/api/v1/utenti/registrazione", "10.0.0.1")).isEqualTo(429);

        // Un IP diverso ha un bucket indipendente: non risente dell'esaurimento del primo.
        assertThat(eseguiRichiesta(filtro, "POST", "/api/v1/utenti/registrazione", "10.0.0.2")).isEqualTo(200);
    }

    @Test
    void endpointPermissivo_esauritoAdArticoli_nonInfluenzaIlTierStretto_stessoIp() throws Exception {
        RateLimitFilter filtro = new RateLimitFilter();

        for (int i = 0; i < 60; i++) {
            eseguiRichiesta(filtro, "GET", "/api/v1/articoli", "10.0.0.5");
        }
        assertThat(eseguiRichiesta(filtro, "GET", "/api/v1/articoli", "10.0.0.5")).isEqualTo(429);

        // Stesso IP, ma tier stretto: bucket separato, non ancora toccato.
        assertThat(eseguiRichiesta(filtro, "POST", "/api/v1/utenti/registrazione", "10.0.0.5")).isEqualTo(200);
    }

    @Test
    void dettaglioArticoloNumerico_eProfiloPubblico_rientranoNelTierPermissivo() throws Exception {
        RateLimitFilter filtro = new RateLimitFilter();

        assertThat(eseguiRichiesta(filtro, "GET", "/api/v1/articoli/42", "10.0.0.9")).isEqualTo(200);
        assertThat(eseguiRichiesta(filtro, "GET", "/api/v1/utenti/7/profilo-pubblico", "10.0.0.9")).isEqualTo(200);
    }

    @Test
    void endpointNonElencato_nonVieneMaiLimitato() throws Exception {
        RateLimitFilter filtro = new RateLimitFilter();

        for (int i = 0; i < 100; i++) {
            assertThat(eseguiRichiesta(filtro, "GET", "/api/v1/utenti/me", "10.0.0.7")).isEqualTo(200);
        }
    }

    @Test
    void rispostaTooManyRequests_haRetryAfterEBodyJsonCoerente() throws Exception {
        RateLimitFilter filtro = new RateLimitFilter();
        for (int i = 0; i < 8; i++) {
            eseguiRichiesta(filtro, "GET", "/api/v1/utenti/verifica-email", "10.0.0.11");
        }

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/utenti/verifica-email");
        request.setRemoteAddr("10.0.0.11");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filtro.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isNotNull();
        assertThat(response.getContentAsString()).contains("\"status\":429").contains("Too Many Requests");
    }

    private int eseguiRichiesta(RateLimitFilter filtro, String metodo, String path, String ip) throws IOException,
            jakarta.servlet.ServletException {
        MockHttpServletRequest request = new MockHttpServletRequest(metodo, path);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filtro.doFilter(request, response, chain);

        // MockFilterChain lascia lo status di default (200) se la catena e' stata invocata: usarlo
        // come proxy di "richiesta passata" e' coerente con l'assenza di un servlet reale a valle.
        return response.getStatus();
    }
}
