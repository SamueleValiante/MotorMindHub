package com.motormindhub.Api.utility.constraints;

import com.motormindhub.Api.model.repository.UtenteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailUnivocaValidatorTest {

    @Mock
    private UtenteRepository utenteRepository;

    @Test
    void isValid_ritornaTrue_quandoEmailNonRegistrata() {
        EmailUnivocaValidator validator = new EmailUnivocaValidator(utenteRepository);
        when(utenteRepository.existsByEmail("nuovo@provider.it")).thenReturn(false);

        assertThat(validator.isValid("nuovo@provider.it", null)).isTrue();
    }

    @Test
    void isValid_ritornaFalse_quandoEmailGiaRegistrata() {
        EmailUnivocaValidator validator = new EmailUnivocaValidator(utenteRepository);
        when(utenteRepository.existsByEmail("marco@provider.it")).thenReturn(true);

        assertThat(validator.isValid("marco@provider.it", null)).isFalse();
    }

    @Test
    void isValid_ritornaTrue_quandoEmailVuota() {
        EmailUnivocaValidator validator = new EmailUnivocaValidator(utenteRepository);

        assertThat(validator.isValid("", null)).isTrue();
    }
}
