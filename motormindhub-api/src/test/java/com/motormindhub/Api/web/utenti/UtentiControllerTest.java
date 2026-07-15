package com.motormindhub.Api.web.utenti;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.motormindhub.Api.model.entity.StatoUtente;
import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.security.UserPrincipal;
import com.motormindhub.Api.service.gestioneUtenti.GestioneUtenti;
import com.motormindhub.Api.service.gestioneUtenti.dto.CurrentUserDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.PublicProfileDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.RegisterUserDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.UpdateProfileDTO;
import com.motormindhub.Api.service.gestioneUtenti.exception.UtenteNonTrovatoException;
import com.motormindhub.Api.utility.constraints.EmailUnivocaValidator;
import com.motormindhub.Api.web.GlobalExceptionHandler;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test standalone del Controller (nessun contesto Spring/DB): verifica il cablaggio HTTP <->
 * Service Layer, la validazione Bean Validation e la traduzione delle eccezioni via
 * GlobalExceptionHandler.
 */
@ExtendWith(MockitoExtension.class)
class UtentiControllerTest {

    @Mock
    private GestioneUtenti gestioneUtenti;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        UtentiController controller = new UtentiController(gestioneUtenti);

        // Fuori da un ApplicationContext Spring, Hibernate Validator non sa iniettare
        // UtenteRepository in EmailUnivocaValidator: lo istanzio a mano con uno stub
        // (l'unicita' dell'email e' gia' coperta da EmailUnivocaValidatorTest).
        LocalValidatorFactoryBean validatorFactoryBean = new LocalValidatorFactoryBean();
        validatorFactoryBean.setConstraintValidatorFactory(new ConstraintValidatorFactory() {
            @Override
            @SuppressWarnings("unchecked")
            public <T extends ConstraintValidator<?, ?>> T getInstance(Class<T> key) {
                if (key == EmailUnivocaValidator.class) {
                    return (T) new EmailUnivocaValidator(mock(com.motormindhub.Api.model.repository.UtenteRepository.class));
                }
                try {
                    return key.getDeclaredConstructor().newInstance();
                } catch (ReflectiveOperationException e) {
                    throw new IllegalStateException(e);
                }
            }

            @Override
            public void releaseInstance(ConstraintValidator<?, ?> instance) {
                // nessuna risorsa da rilasciare
            }
        });
        validatorFactoryBean.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setValidator(validatorFactoryBean)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void autenticaComeUtente(Long id) {
        Utente utente = new Utente("Marco", "Verdi", "marco@provider.it", "hash", null, null, true, null);
        ReflectionTestUtils.setField(utente, "id", id);
        utente.setStato(StatoUtente.ATTIVO);
        UserPrincipal principal = new UserPrincipal(utente);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @Test
    void registerUser_ritorna201_quandoBodyValido() throws Exception {
        RegisterUserDTO dto = new RegisterUserDTO("Marco", "Verdi", "marco@provider.it",
                "Ahgeydg78LF!", null, null, true);
        when(gestioneUtenti.registerUser(dto)).thenReturn(1L);

        mockMvc.perform(post("/api/v1/utenti/registrazione")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void registerUser_ritorna400_quandoConsensoPrivacyMancante() throws Exception {
        RegisterUserDTO dto = new RegisterUserDTO("Marco", "Verdi", "marco@provider.it",
                "Ahgeydg78LF!", null, null, false);

        mockMvc.perform(post("/api/v1/utenti/registrazione")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void verifyEmail_ritorna200_quandoTokenPresente() throws Exception {
        mockMvc.perform(get("/api/v1/utenti/verifica-email").param("token", "tok-123"))
                .andExpect(status().isOk());

        verify(gestioneUtenti).verifyEmail("tok-123");
    }

    @Test
    void getCurrentUser_restituisceIlProfiloDellUtenteAutenticato_nonUnIdEsterno() throws Exception {
        autenticaComeUtente(5L);
        when(gestioneUtenti.getCurrentUser(5L)).thenReturn(new CurrentUserDTO(
                "marco@provider.it", com.motormindhub.Api.model.entity.Ruolo.ISCRITTO,
                StatoUtente.ATTIVO, java.time.Instant.parse("2026-01-10T10:00:00Z"),
                "Marco", "Verdi", null, "Bio"));

        mockMvc.perform(get("/api/v1/utenti/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("marco@provider.it"))
                .andExpect(jsonPath("$.ruolo").value("ISCRITTO"))
                .andExpect(jsonPath("$.stato").value("ATTIVO"));

        // Nessun id passato dalla richiesta: la sola fonte e' il principal in SecurityContext.
        verify(gestioneUtenti).getCurrentUser(5L);
    }

    @Test
    void updateProfile_deleganAllUtenteAutenticato() throws Exception {
        autenticaComeUtente(5L);
        UpdateProfileDTO dto = new UpdateProfileDTO("Marco", "Bianchi", null, "Bio aggiornata");

        mockMvc.perform(put("/api/v1/utenti/me")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        verify(gestioneUtenti).updateProfile(eq(5L), eq(dto));
    }

    @Test
    void getPublicProfile_ritorna200ConDatiPubblici() throws Exception {
        when(gestioneUtenti.getPublicProfile(3L))
                .thenReturn(new PublicProfileDTO(3L, "Giulia", "Neri", null, "Meccatronica"));

        mockMvc.perform(get("/api/v1/utenti/3/profilo-pubblico"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Giulia"))
                .andExpect(jsonPath("$.cognome").value("Neri"));
    }

    @Test
    void getPublicProfile_ritorna404_quandoUtenteInesistente() throws Exception {
        when(gestioneUtenti.getPublicProfile(99L))
                .thenThrow(new UtenteNonTrovatoException("Utente non trovato."));

        mockMvc.perform(get("/api/v1/utenti/99/profilo-pubblico"))
                .andExpect(status().isNotFound());
    }
}
