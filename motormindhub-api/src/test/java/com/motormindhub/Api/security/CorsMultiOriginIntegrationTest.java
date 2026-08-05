package com.motormindhub.Api.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifica che app.cors.allowed-origins, quando configurata con piu' origini separate da virgola
 * (non solo il default singolo), venga davvero splittata e ciascuna origine autorizzata
 * indipendentemente - non solo la prima/unica. @TestPropertySource con un valore diverso dal
 * default usa un contesto Spring dedicato (chiave di cache diversa, stesso pattern gia' usato per
 * LoginRateLimitIntegrationTest), non interferisce con CorsConfigurationIntegrationTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "app.cors.allowed-origins=https://motor-mind-hub.vercel.app,https://futuro-dominio-custom.it")
class CorsMultiOriginIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void corsAllowOrigin_rispecchiaLaPrimaOrigineConfigurata() throws Exception {
        mockMvc.perform(get("/api/v1/categorie").header("Origin", "https://motor-mind-hub.vercel.app"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://motor-mind-hub.vercel.app"));
    }

    @Test
    void corsAllowOrigin_rispecchiaLaSecondaOrigineConfigurata() throws Exception {
        mockMvc.perform(get("/api/v1/categorie").header("Origin", "https://futuro-dominio-custom.it"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://futuro-dominio-custom.it"));
    }

    /** Spring rifiuta a livello di filtro (403 "Invalid CORS request") un Origin fuori dall'elenco configurato: qui persino il default "vecchio" (localhost:3000) non e' piu' autorizzato, perche' non fa parte di QUESTO elenco configurato. */
    @Test
    void corsRifiutaLaRichiesta_perUnOrigineFuoriDallElencoConfigurato() throws Exception {
        mockMvc.perform(get("/api/v1/categorie").header("Origin", "http://localhost:3000"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
