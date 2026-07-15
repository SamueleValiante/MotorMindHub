package com.motormindhub.Api.service.gestioneArticoli.dto;

import com.motormindhub.Api.model.entity.TipoLista;
import jakarta.validation.constraints.NotNull;

/** RF1.7, UC_6 - mockup 03b_menu_salvataggio.png ("Aggiungi ai Preferiti" / "Aggiungi a Leggi più tardi"). */
public record SaveArticleDTO(
        @NotNull
        TipoLista tipoLista
) {
}
