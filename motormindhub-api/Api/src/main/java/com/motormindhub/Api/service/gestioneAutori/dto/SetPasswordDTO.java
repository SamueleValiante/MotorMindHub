package com.motormindhub.Api.service.gestioneAutori.dto;

import com.motormindhub.Api.utility.constraints.PasswordSicura;

/** UC_10 - password scelta dall'invitato in fase di accettazione (ODD 2.4 acceptInvite). */
public record SetPasswordDTO(
        @PasswordSicura
        String password
) {
}
