package com.motormindhub.Api.web.articoli;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.model.repository.UtenteRepository;
import com.motormindhub.Api.service.storage.CloudStorageService;
import com.motormindhub.Api.web.auth.LoginRequestDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test end-to-end di POST /api/v1/articoli/immagini-corpo (SDD 3.2): stesso approccio di
 * ImmagineCopertinaUploadIntegrationTest - CloudStorageService mockato, auth/validazione reali.
 * Copre solo cio' che e' nuovo rispetto a /copertine (cartella separata, RBAC sulla nuova rotta):
 * la validazione applicativa (formato/dimensione) e' la stessa gia' coperta li'.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ImmagineCorpoArticoloUploadIntegrationTest {

    private static final String PASSWORD = "PasswordValida78!";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtenteRepository utenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @MockitoBean
    private CloudStorageService cloudStorageService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static byte[] pngValido() throws Exception {
        var image = new java.awt.image.BufferedImage(4, 4, java.awt.image.BufferedImage.TYPE_INT_RGB);
        var out = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private String creaUtenteELogga(String email, Ruolo ruolo) throws Exception {
        Utente utente = new Utente("Giulia", "Rossi", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
        utente.setStato(StatoUtente.ATTIVO);
        utente.setRuolo(ruolo);
        utenteRepository.saveAndFlush(utente);

        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequestDTO(email, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void upload_ritornaUrl_inUnaCartellaSeparataDallaCopertina() throws Exception {
        String jwt = creaUtenteELogga("upload-corpo-autore@provider.it", Ruolo.AUTORE);
        when(cloudStorageService.upload(any(), eq("immagini-corpo-articoli")))
                .thenReturn("https://res.cloudinary.com/demo/immagini-corpo-articoli/abc.png");

        MockMultipartFile file = new MockMultipartFile("file", "diagramma.png", "image/png", pngValido());

        mockMvc.perform(multipart("/api/v1/articoli/immagini-corpo").file(file)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://res.cloudinary.com/demo/immagini-corpo-articoli/abc.png"));
    }

    @Test
    void upload_ritorna403_perIscritto() throws Exception {
        String jwt = creaUtenteELogga("upload-corpo-iscritto@provider.it", Ruolo.ISCRITTO);
        MockMultipartFile file = new MockMultipartFile("file", "diagramma.png", "image/png", pngValido());

        mockMvc.perform(multipart("/api/v1/articoli/immagini-corpo").file(file)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
    }
}
