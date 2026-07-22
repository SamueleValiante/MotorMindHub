package com.motormindhub.Api.service.gestioneUtenti.exception;

/**
 * RNF9.3: il token di verifica email esiste ed e' associato a un account NON_VERIFICATO, ma la sua
 * scadenza (24h dalla registrazione) e' trascorsa. Distinta da {@link TokenNonValidoException}
 * (token inesistente o account gia' verificato) cosi' che il client possa offrire un flusso di
 * reinvio dedicato invece del generico "link non valido" - il reinvio stesso non e' ancora implementato.
 */
public class TokenVerificaScadutoException extends RuntimeException {

    public TokenVerificaScadutoException(String message) {
        super(message);
    }
}
