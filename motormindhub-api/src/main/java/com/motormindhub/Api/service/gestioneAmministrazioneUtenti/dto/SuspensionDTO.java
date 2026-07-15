package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * RF4.3, UC_23 - popup "Sospendi account" (mockup 41_gestore_popup_sospendi.png, rigenerato dopo
 * l'export rotto iniziale). Il campo allineato al RAD, Tabella Formati §1.5.1 ("Motivazione
 * sospensione": Stringa di testo, selezione da elenco predefinito + note libere opzionali) e' quindi
 * uno {@link MotivazioneSospensione} obbligatorio piu' un campo di note libere opzionale, non piu'
 * una stringa libera come nella versione precedente di questo DTO (scritta quando il mockup era
 * ancora illeggibile). durataGiorni null = sospensione permanente (RAD: "Numero intero (giorni) o
 * valore 'Permanente'").
 */
public record SuspensionDTO(
        @NotNull(message = "E' necessario selezionare una motivazione per procedere con la sospensione.")
        MotivazioneSospensione motivazione,

        @Size(max = 1000)
        String noteAggiuntive,

        @Positive(message = "La durata della sospensione non e' valida.")
        Integer durataGiorni
) {
}
