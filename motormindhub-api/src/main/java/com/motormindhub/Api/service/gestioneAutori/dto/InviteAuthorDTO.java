package com.motormindhub.Api.service.gestioneAutori.dto;

import com.motormindhub.Api.model.entity.Ruolo;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** RF3.3, UC_8, UC_9. */
public record InviteAuthorDTO(
        @NotBlank
        String nome,

        @NotBlank
        String cognome,

        @NotBlank
        @Email(message = "Inserire un indirizzo email valido (es. utente@provider.it).")
        String email,

        @NotNull
        Ruolo ruolo
) {
}
