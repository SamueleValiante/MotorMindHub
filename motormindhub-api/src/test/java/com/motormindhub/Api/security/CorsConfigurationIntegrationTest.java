package com.motormindhub.Api.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SecurityConfig.corsConfigurationSource: prima di questa modifica era un List.of(...) hardcoded
 * nel codice Java - CORS_ALLOWED_ORIGINS impostata su Railway non aveva mai avuto alcun effetto.
 * Verifica end-to-end (filter chain reale, non il solo valore della property) che
 * Access-Control-Allow-Origin nella risposta rispecchi davvero app.cors.allowed-origins, non solo
 * che l'app si avvii con quella property presente. Copertura del valore configurato non-default
 * (piu' origini separate da virgola) in CorsMultiOriginIntegrationTest, contesto Spring separato.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CorsConfigurationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void corsAllowOrigin_rispecchiaLOrigineConfigurata_valoreDiDefault_localhost3000() throws Exception {
        mockMvc.perform(get("/api/v1/categorie").header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    /** Spring rifiuta a livello di filtro (403 "Invalid CORS request") un Origin fuori dall'elenco configurato, non lascia semplicemente passare la richiesta senza l'header. */
    @Test
    void corsRifiutaLaRichiesta_perUnOrigineNonAutorizzata_valoreDiDefault() throws Exception {
        mockMvc.perform(get("/api/v1/categorie").header("Origin", "https://origine-non-autorizzata.example.com"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
