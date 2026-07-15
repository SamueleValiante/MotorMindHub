package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.dto;

/**
 * Elenco predefinito delle motivazioni di sospensione (RAD, Tabella Formati §1.5.1 - "Motivazione
 * sospensione": Stringa di testo, selezione da elenco predefinito + note libere opzionali; vedi
 * {@link SuspensionDTO#noteAggiuntive()} per la parte libera).
 *
 * ATTENZIONE - i 6 valori seguenti NON sono confermati da una fonte primaria esplicita: ne' il RAD,
 * ne' l'ODD, ne' l'SDD elencano l'insieme completo delle voci ammesse (il RAD si limita a dire
 * "elenco predefinito", senza elencarlo), e il mockup 41_gestore_popup_sospendi.png (gia' una volta
 * rigenerato dopo un export rotto - stesso problema gia' riscontrato e documentato altrove per i
 * mockup inizialmente non leggibili, es. RemoveAuthorPolicyDTO) mostra solo un singolo esempio gia'
 * selezionato: "Violazione dei Termini di Servizio - contenuti inappropriati". I 6 valori sono quindi
 * un'inferenza, ricavata per coerenza dalle categorie gia' usate per le segnalazioni degli utenti
 * (mockup 44_gestore_coda_segnalazioni.png - "Contenuti inappropriati", "Nome utente offensivo",
 * "Spam ripetuto nei commenti", "Molestie verso altri utenti"), dato che una sospensione tipicamente
 * scaturisce da una segnalazione scalata (RF4.3, RF4.5, UC_26.2) - non un elenco confermato dal
 * cliente/stakeholder. Se una fonte primaria con l'elenco autentico diventa disponibile, questo enum
 * va rivisto di conseguenza.
 */
public enum MotivazioneSospensione {
    CONTENUTI_INAPPROPRIATI("Violazione dei Termini di Servizio - contenuti inappropriati"),
    LINGUAGGIO_OFFENSIVO("Violazione dei Termini di Servizio - linguaggio offensivo"),
    SPAM("Violazione dei Termini di Servizio - spam ripetuto"),
    MOLESTIE("Violazione dei Termini di Servizio - molestie verso altri utenti"),
    NOME_UTENTE_NON_CONFORME("Violazione dei Termini di Servizio - nome utente non conforme"),
    ALTRO("Altro (specificare nelle note)");

    private final String etichetta;

    MotivazioneSospensione(String etichetta) {
        this.etichetta = etichetta;
    }

    public String getEtichetta() {
        return etichetta;
    }
}
