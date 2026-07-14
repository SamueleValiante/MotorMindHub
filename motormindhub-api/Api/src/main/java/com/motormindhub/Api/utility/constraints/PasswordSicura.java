package com.motormindhub.Api.utility.constraints;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Valida che una password rispetti i criteri di sicurezza minimi (RAD 1.5.1): almeno 8 caratteri,
 * una maiuscola, una minuscola, una cifra e un carattere speciale.
 */
@Documented
@Constraint(validatedBy = PasswordSicuraValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface PasswordSicura {

    String message() default "La password non rispetta i criteri di sicurezza richiesti "
            + "(es. troppo corta o priva di caratteri speciali).";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
