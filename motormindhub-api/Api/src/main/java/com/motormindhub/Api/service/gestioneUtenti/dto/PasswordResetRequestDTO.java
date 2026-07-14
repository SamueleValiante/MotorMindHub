package com.motormindhub.Api.service.gestioneUtenti.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** RF1.5, UC_3. */
public record PasswordResetRequestDTO(
        @NotBlank
        @Email(message = "Inserire un indirizzo email valido (es. utente@provider.it).")
        String email
) {
}
