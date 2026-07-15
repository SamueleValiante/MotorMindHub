package com.motormindhub.Api.utility.constraints;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordSicuraValidatorTest {

    private final PasswordSicuraValidator validator = new PasswordSicuraValidator();

    @ParameterizedTest
    @ValueSource(strings = {"Ahgeydg78LF!", "Str0ng&Pass", "C0mplex$Password1"})
    void isValid_ritornaTrue_perPasswordCheRispettanoTuttiICriteri(String password) {
        assertThat(validator.isValid(password, null)).isTrue();
    }

    @ParameterizedTest
    @CsvSource({
            "corta1!,",          // troppo corta
            "solominuscole1!,",  // priva di maiuscola
            "SOLOMAIUSCOLE1!,",  // priva di minuscola
            "SenzaCifre!!,",     // priva di cifra
            "SenzaSpeciale78,"   // priva di carattere speciale
    })
    void isValid_ritornaFalse_perPasswordCheViolanoUnCriterio(String password) {
        assertThat(validator.isValid(password, null)).isFalse();
    }

    @org.junit.jupiter.api.Test
    void isValid_ritornaFalse_perPasswordNulla() {
        assertThat(validator.isValid(null, null)).isFalse();
    }
}
