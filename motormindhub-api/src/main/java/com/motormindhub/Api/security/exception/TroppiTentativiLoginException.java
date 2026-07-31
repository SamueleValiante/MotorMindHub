package com.motormindhub.Api.security.exception;

/**
 * Troppi tentativi di login sulla stessa email in poco tempo (LoginRateLimiter). Distinto dal
 * blocco per-account di RNF2.6 (5 tentativi falliti, GestioneUtenti.registerFailedLoginAttempt):
 * qui si conta ogni tentativo (riuscito o no) per email, indipendentemente dall'IP di provenienza,
 * come ulteriore difesa contro il credential stuffing distribuito su piu' IP verso lo stesso
 * account - cosa che il blocco per-account da solo non impedisce finche' resta sotto soglia.
 */
public class TroppiTentativiLoginException extends RuntimeException {

    public TroppiTentativiLoginException(String message) {
        super(message);
    }
}
