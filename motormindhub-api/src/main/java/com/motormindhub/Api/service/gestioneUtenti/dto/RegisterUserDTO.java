package com.motormindhub.Api.service.gestioneUtenti.dto;

import com.motormindhub.Api.utility.constraints.EmailUnivoca;
import com.motormindhub.Api.utility.constraints.PasswordSicura;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * RF1.3, UC_1. La foto profilo e' opzionale ed e' rappresentata come URL: l'upload verso il
 * Cloud Storage (S3/Cloudinary, SDD 3.2) e' responsabilita' del Front-End, fuori dallo scope di
 * questo sottosistema.
 */
public record RegisterUserDTO(
        @NotBlank(message = "Il campo 'Nome' e' obbligatorio e non puo' contenere caratteri speciali non validi.")
        @Size(max = 100)
        String nome,

        @NotBlank(message = "Il campo 'Cognome' e' obbligatorio e non puo' contenere caratteri speciali non validi.")
        @Size(max = 100)
        String cognome,

        @NotBlank(message = "Inserire un indirizzo email valido (es. utente@provider.it).")
        @Email(message = "Inserire un indirizzo email valido (es. utente@provider.it).")
        @EmailUnivoca
        String email,

        @PasswordSicura
        String password,

        String fotoProfilo,

        @Size(max = 1000, message = "La biografia ha superato il limite massimo di caratteri consentiti.")
        String biografia,

        @AssertTrue(message = "E' obbligatorio accettare l'informativa sulla privacy per procedere con la registrazione.")
        boolean consensoPrivacy
) {
}
