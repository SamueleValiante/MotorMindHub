package com.motormindhub.Api.service.gestioneArticoli.exception;

/**
 * Usata sia per la pre-condizione di createDraft (autore con ruolo AUTORE/MANAGER_AUTORI, ODD 2.2)
 * sia per il controllo di ownership aggiunto su updateDraft/publishArticle/updatePublishedArticle/
 * deleteDraft/deleteArticle (solo l'autore proprietario o un Manager Autori possono operare
 * sull'articolo - non specificato esplicitamente dall'OCL ma necessario per evitare che un Autore
 * modifichi gli articoli di un collega).
 */
public class AutoreNonValidoException extends RuntimeException {

    public AutoreNonValidoException(String message) {
        super(message);
    }
}
