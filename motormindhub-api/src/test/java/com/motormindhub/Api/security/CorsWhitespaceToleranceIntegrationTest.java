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
 * app.cors.allowed-origins con spazi residui attorno alle virgole (es. " https://esempio.it" invece
 * di "https://esempio.it") - lo scenario reale che ha fatto scoprire il gap: un valore incollato in
 * una dashboard di hosting con un a-capo/spazio finale. Senza trim() per elemento in
 * SecurityConfig.corsConfigurationSource, Spring confronterebbe l'Origin (senza spazi) contro una
 * stringa con lo spazio incluso - mai uguali, 403 sempre, indistinguibile da un valore sbagliato.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "app.cors.allowed-origins= https://motor-mind-hub.vercel.app , https://futuro-dominio-custom.it ,")
class CorsWhitespaceToleranceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void corsAllowOrigin_rispecchiaLOrigine_nonostanteSpaziResiduiNelValoreConfigurato() throws Exception {
        mockMvc.perform(get("/api/v1/categorie").header("Origin", "https://motor-mind-hub.vercel.app"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://motor-mind-hub.vercel.app"));
    }

    @Test
    void corsAllowOrigin_rispecchiaLaSecondaOrigine_nonostanteSpaziResiduiNelValoreConfigurato() throws Exception {
        mockMvc.perform(get("/api/v1/categorie").header("Origin", "https://futuro-dominio-custom.it"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://futuro-dominio-custom.it"));
    }
}
