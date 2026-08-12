package com.motormindhub.Api.web.visite;

import com.motormindhub.Api.model.entity.Ruolo;
import com.motormindhub.Api.security.UserPrincipal;
import com.motormindhub.Api.service.gestioneAmministrazioneUtenti.GestioneAmministrazioneUtenti;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * Endpoint pubblico per la registrazione di una visita (RF3.1, UC_28) - a differenza di
 * AmministrazioneUtentiController (interamente riservato al Gestore Utenti, cfr. la sua javadoc
 * "nessun endpoint pubblico"), questo controller esiste apposta perche' registrare una visita deve
 * essere possibile anche per un Guest non autenticato: separarlo mantiene invariato quel vincolo
 * dell'altro controller, pur condividendo la stessa facade di servizio (GestioneAmministrazioneUtenti).
 */
@RestController
@RequestMapping("/api/v1/visite")
public class VisiteController {

    private static final String COOKIE_SESSIONE = "mmh_visit_session";

    private final GestioneAmministrazioneUtenti gestioneAmministrazioneUtenti;

    public VisiteController(GestioneAmministrazioneUtenti gestioneAmministrazioneUtenti) {
        this.gestioneAmministrazioneUtenti = gestioneAmministrazioneUtenti;
    }

    /**
     * Nessun corpo di richiesta/risposta: il chiamante (frontend) non deve distinguere una nuova
     * registrazione da una no-op (ruolo redazionale escluso, o sessione gia' registrata) - il cookie
     * di risposta, presente solo nel primo caso, e' sufficiente e trasparente. L'identificativo di
     * sessione e' generato qui dal backend, mai dal frontend (GestioneAmministrazioneUtenti.registraVisita).
     */
    @PostMapping
    public ResponseEntity<Void> registraVisita(@AuthenticationPrincipal UserPrincipal principal,
                                                @CookieValue(name = COOKIE_SESSIONE, required = false) String sessioneIdEsistente,
                                                HttpServletRequest request) {
        Ruolo callerRuolo = principal == null ? null : principal.getRuolo();
        Optional<String> nuovoSessioneId = gestioneAmministrazioneUtenti.registraVisita(sessioneIdEsistente, callerRuolo);

        ResponseEntity.HeadersBuilder<?> risposta = ResponseEntity.noContent();
        if (nuovoSessioneId.isPresent()) {
            risposta.header(HttpHeaders.SET_COOKIE, cookieSessione(nuovoSessioneId.get(), request.isSecure()).toString());
        }
        return risposta.build();
    }

    /**
     * SameSite=None e' necessario in produzione (frontend e backend su domini diversi, CORS ha gia'
     * allowCredentials(true) come prerequisito) ma richiede Secure, che a sua volta va rifiutato in
     * sviluppo locale via HTTP semplice (il browser scarta un cookie Secure su una risposta non
     * HTTPS) - da qui la scelta condizionata su request.isSecure() invece di un valore fisso. Nessun
     * maxAge impostato: cookie di sessione browser, si estingue alla chiusura (vedi VisitaSessione).
     */
    private static ResponseCookie cookieSessione(String valore, boolean richiestaSicura) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(COOKIE_SESSIONE, valore)
                .httpOnly(true)
                .path("/api/v1/visite");
        return richiestaSicura
                ? builder.secure(true).sameSite("None").build()
                : builder.secure(false).sameSite("Lax").build();
    }
}
