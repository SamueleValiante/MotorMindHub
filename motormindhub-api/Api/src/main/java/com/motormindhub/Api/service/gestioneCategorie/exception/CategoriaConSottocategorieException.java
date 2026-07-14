package com.motormindhub.Api.service.gestioneCategorie.exception;

/**
 * Guardia difensiva non richiesta esplicitamente dal contratto OCL (ODD 2.3), ma necessaria per
 * evitare la violazione del vincolo di integrita' referenziale categoria_padre_id: l'ODD specifica
 * solo la riassegnazione degli Articolo orfani, non delle sottocategorie orfane.
 */
public class CategoriaConSottocategorieException extends RuntimeException {

    public CategoriaConSottocategorieException(String message) {
        super(message);
    }
}
