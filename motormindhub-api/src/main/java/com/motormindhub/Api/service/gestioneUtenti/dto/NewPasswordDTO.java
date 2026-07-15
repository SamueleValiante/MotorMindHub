package com.motormindhub.Api.service.gestioneUtenti.dto;

import com.motormindhub.Api.utility.constraints.PasswordSicura;

/** RF1.5, UC_3 - reimpostazione password tramite token monouso. */
public record NewPasswordDTO(
        @PasswordSicura
        String password
) {
}
