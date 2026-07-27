package com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception;

/**
 * Controllo di ownership aggiunto a suspendAccount, non specificato esplicitamente dall'OCL (ODD 2.5)
 * ma necessario per evitare che un Gestore Utenti compromesso o malevolo elimini la capacita' di
 * moderazione di un altro Gestore sospendendone l'account (stesso principio gia' applicato da
 * AutoreNonValidoException in GestioneArticoli per l'ownership degli articoli). L'auto-sospensione
 * resta permessa: non e' un vettore di sicurezza (nessun vantaggio per un attaccante nel disattivare
 * il proprio account), solo un incidente recuperabile da un altro Gestore.
 */
public class GestoreNonAutorizzatoException extends RuntimeException {

    public GestoreNonAutorizzatoException(String message) {
        super(message);
    }
}
