package com.motormindhub.Api.utility.constraints;

import com.motormindhub.Api.model.repository.UtenteRepository;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;

public class EmailUnivocaValidator implements ConstraintValidator<EmailUnivoca, String> {

    private final UtenteRepository utenteRepository;

    @Autowired
    public EmailUnivocaValidator(UtenteRepository utenteRepository) {
        this.utenteRepository = utenteRepository;
    }

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if (email == null || email.isBlank()) {
            return true; // delegato a @NotBlank/@Email
        }
        return !utenteRepository.existsByEmail(email);
    }
}
