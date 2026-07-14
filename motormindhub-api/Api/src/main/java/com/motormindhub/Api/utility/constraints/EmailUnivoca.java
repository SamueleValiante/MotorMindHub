package com.motormindhub.Api.utility.constraints;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Valida che nessun Utente esistente sia gia' registrato con la stessa email (ODD 2.1, invariante
 * di GestioneUtenti). Difesa di primo livello a livello di DTO; il service verifica nuovamente la
 * pre-condizione per evitare race condition tra validazione e persistenza.
 */
@Documented
@Constraint(validatedBy = EmailUnivocaValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface EmailUnivoca {

    String message() default "Un account con questo indirizzo email esiste gia'.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
