package com.motormindhub.Api.security;

import com.motormindhub.Api.service.gestioneUtenti.GestioneUtenti;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationFailureBadCredentialsEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

/**
 * Adatta gli eventi di autenticazione di Spring Security (pubblicati dal
 * DefaultAuthenticationEventPublisher collegato in SecurityConfig) alle misure anti-bruteforce di
 * GestioneUtenti (RNF2.6). Solo AuthenticationFailureBadCredentialsEvent incrementa il contatore:
 * un tentativo respinto perche' l'account e' gia' SOSPESO/bloccato produce invece un
 * AuthenticationFailureLockedEvent (o DisabledEvent), volutamente ignorato qui per non estendere
 * ulteriormente un blocco gia' attivo.
 */
@Component
public class LoginAttemptListener {

    private final GestioneUtenti gestioneUtenti;

    public LoginAttemptListener(GestioneUtenti gestioneUtenti) {
        this.gestioneUtenti = gestioneUtenti;
    }

    @EventListener
    public void onLoginFallito(AuthenticationFailureBadCredentialsEvent evento) {
        gestioneUtenti.registerFailedLoginAttempt(evento.getAuthentication().getName());
    }

    @EventListener
    public void onLoginRiuscito(AuthenticationSuccessEvent evento) {
        gestioneUtenti.registerSuccessfulLogin(evento.getAuthentication().getName());
    }
}
