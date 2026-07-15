package com.motormindhub.Api.utility.constraints;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class PasswordSicuraValidator implements ConstraintValidator<PasswordSicura, String> {

    private static final Pattern MAIUSCOLA = Pattern.compile("[A-Z]");
    private static final Pattern MINUSCOLA = Pattern.compile("[a-z]");
    private static final Pattern CIFRA = Pattern.compile("[0-9]");
    private static final Pattern CARATTERE_SPECIALE = Pattern.compile("[^A-Za-z0-9]");
    private static final int LUNGHEZZA_MINIMA = 8;

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.length() < LUNGHEZZA_MINIMA) {
            return false;
        }
        return MAIUSCOLA.matcher(password).find()
                && MINUSCOLA.matcher(password).find()
                && CIFRA.matcher(password).find()
                && CARATTERE_SPECIALE.matcher(password).find();
    }
}
