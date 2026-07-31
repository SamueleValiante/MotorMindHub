package com.motormindhub.Api.web.utenti;

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
 * Test end-to-end di POST /api/v1/utenti/me/foto-profilo (SDD 3.2): CloudStorageService mockato
 * (nessuna chiamata di rete reale verso Cloudinary in questa suite - cfr. CloudinaryStorageServiceTest
 * per la logica del provider), ma auth reale (filter chain, @PreAuthorize) e ImageUploadValidator
 * reale, cosi' da verificare il cablaggio end-to-end e non solo i singoli pezzi in isolamento.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FotoProfiloUploadIntegrationTest {

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
        Utente utente = new Utente("Marco", "Verdi", email, passwordEncoder.encode(PASSWORD), null, null, true, null);
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
    void upload_ritornaUrl_quandoFileValidoEUtenteAutenticato() throws Exception {
        String jwt = creaUtenteELogga("upload-foto-iscritto@provider.it", Ruolo.ISCRITTO);
        when(cloudStorageService.upload(any(), eq("profili"))).thenReturn("https://res.cloudinary.com/demo/profili/abc.png");

        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", pngValido());

        mockMvc.perform(multipart("/api/v1/utenti/me/foto-profilo").file(file)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://res.cloudinary.com/demo/profili/abc.png"));
    }

    @Test
    void upload_ritorna401_seNonAutenticato() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", pngValido());

        mockMvc.perform(multipart("/api/v1/utenti/me/foto-profilo").file(file))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void upload_ritorna403_perGestoreUtenti() throws Exception {
        String jwt = creaUtenteELogga("upload-foto-gestore@provider.it", Ruolo.GESTORE_UTENTI);
        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", pngValido());

        mockMvc.perform(multipart("/api/v1/utenti/me/foto-profilo").file(file)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isForbidden());
    }

    @Test
    void upload_ritorna400_conErrorCodeFormatoNonSupportato_seFileFuoriWhitelist() throws Exception {
        String jwt = creaUtenteELogga("upload-foto-formato@provider.it", Ruolo.ISCRITTO);
        MockMultipartFile file = new MockMultipartFile("file", "documento.pdf", "application/pdf", "non-importa".getBytes());

        mockMvc.perform(multipart("/api/v1/utenti/me/foto-profilo").file(file)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("FORMATO_NON_SUPPORTATO"));
    }

    @Test
    void upload_ritorna400_conErrorCodeFileNonValido_seContentTypeCorrettoMaContenutoFinto() throws Exception {
        String jwt = creaUtenteELogga("upload-foto-finta@provider.it", Ruolo.ISCRITTO);
        MockMultipartFile file = new MockMultipartFile("file", "finta.jpg", "image/jpeg", "non e' un'immagine".getBytes());

        mockMvc.perform(multipart("/api/v1/utenti/me/foto-profilo").file(file)
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("FILE_NON_VALIDO"));
    }
}
