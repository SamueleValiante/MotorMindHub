package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * RF4.3, UC_23 - popup "Sospendi account". Il mockup di riferimento
 * (41_gestore_popup_sospendi.png) non e' stato esportato correttamente (e' un duplicato della
 * schermata "Gestione Account" sottostante, byte-identico a 49_gestore_conferma_esportazione.png -
 * stesso problema gia' riscontrato con 31/32/35 in GestioneAutori): l'elenco predefinito di
 * motivazioni citato dal RAD ("da elenco predefinito") non e' quindi verificabile. motivazione resta
 * una stringa libera, coerente con ReportUserDTO.motivazione (GestioneUtenti) - l'eventuale dropdown
 * a elenco chiuso e' una scelta di solo front-end che non cambia il contratto REST.
 * durataGiorni null = sospensione permanente (RF4.3: "temporanea in giorni, o permanente").
 */
public record SuspensionDTO(
        @NotBlank(message = "E' necessario indicare una motivazione per la sospensione.")
        String motivazione,

        @Positive(message = "La durata della sospensione deve essere un numero di giorni positivo.")
        Integer durataGiorni
) {
}
