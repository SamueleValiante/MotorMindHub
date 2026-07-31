package com.motormindhub.Api.web;

import com.motormindhub.Api.security.exception.RefreshTokenNonValidoException;
import com.motormindhub.Api.security.exception.TroppiTentativiLoginException;
import com.motormindhub.Api.service.gestioneUtenti.exception.AccountNonAttivoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.EmailGiaRegistrataException;
import com.motormindhub.Api.service.gestioneUtenti.exception.RichiestaCancellazioneEsistenteException;
import com.motormindhub.Api.service.gestioneUtenti.exception.TokenNonValidoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.TokenVerificaScadutoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.UtenteNonTrovatoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

/**
 * Traduzione centralizzata delle eccezioni applicative in risposte HTTP. Cross-cutting rispetto ai
 * sottosistemi (OM1.0): non appartiene a un singolo pacchetto /web/&lt;sottosistema&gt;.
 * Le eccezioni "RegolaDiDominioViolataException" sono locali a ciascun sottosistema (ODD 2,
 * convenzione /service/gestioneXxx/exception): qui sono referenziate per nome completo per evitare
 * conflitti di import tra pacchetti omonimi.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({
            UtenteNonTrovatoException.class,
            com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaNonTrovataException.class,
            com.motormindhub.Api.service.gestioneArticoli.exception.ArticoloNonTrovatoException.class,
            com.motormindhub.Api.service.gestioneArticoli.exception.CategoriaNonTrovataException.class,
            com.motormindhub.Api.service.gestioneArticoli.exception.UtenteNonTrovatoException.class,
            com.motormindhub.Api.service.gestioneArticoli.exception.ArticoloNonSalvatoException.class,
            com.motormindhub.Api.service.gestioneAutori.exception.InvitoNonTrovatoException.class,
            com.motormindhub.Api.service.gestioneAutori.exception.AutoreNonTrovatoException.class,
            com.motormindhub.Api.service.gestioneAutori.exception.ArticoloNonTrovatoException.class,
            com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.UtenteNonTrovatoException.class,
            com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.SegnalazioneNonTrovataException.class,
            com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.RichiestaCancellazioneNonTrovataException.class
    })
    public ResponseEntity<ErrorResponseDTO> handleNonTrovato(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponseDTO.of(HttpStatus.NOT_FOUND.value(), "Not Found", ex.getMessage()));
    }

    @ExceptionHandler({
            EmailGiaRegistrataException.class,
            RichiestaCancellazioneEsistenteException.class,
            com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaGiaEsistenteException.class,
            com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaConSottocategorieException.class,
            com.motormindhub.Api.service.gestioneArticoli.exception.ArticoloGiaSalvatoException.class,
            com.motormindhub.Api.service.gestioneArticoli.exception.StatoArticoloNonValidoException.class,
            com.motormindhub.Api.service.gestioneAutori.exception.InvitoGiaEsistenteException.class,
            com.motormindhub.Api.service.gestioneAutori.exception.EmailGiaRegistrataException.class,
            com.motormindhub.Api.service.gestioneAutori.exception.StatoArticoloNonValidoException.class,
            com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.StatoAccountNonValidoException.class,
            com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.ContenutiInSospesoException.class
    })
    public ResponseEntity<ErrorResponseDTO> handleConflitto(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponseDTO.of(HttpStatus.CONFLICT.value(), "Conflict", ex.getMessage()));
    }

    @ExceptionHandler(AccountNonAttivoException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccountNonAttivo(AccountNonAttivoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponseDTO.of(HttpStatus.CONFLICT.value(), "Conflict", ex.getMessage()));
    }

    @ExceptionHandler(com.motormindhub.Api.service.gestioneArticoli.exception.AutoreNonValidoException.class)
    public ResponseEntity<ErrorResponseDTO> handleAutoreNonValido(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponseDTO.of(HttpStatus.FORBIDDEN.value(), "Forbidden", ex.getMessage()));
    }

    @ExceptionHandler(com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.GestoreNonAutorizzatoException.class)
    public ResponseEntity<ErrorResponseDTO> handleGestoreNonAutorizzato(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponseDTO.of(HttpStatus.FORBIDDEN.value(), "Forbidden", ex.getMessage()));
    }

    @ExceptionHandler({
            com.motormindhub.Api.service.gestioneUtenti.exception.RegolaDiDominioViolataException.class,
            com.motormindhub.Api.service.gestioneCategorie.exception.RegolaDiDominioViolataException.class,
            com.motormindhub.Api.service.gestioneArticoli.exception.RegolaDiDominioViolataException.class,
            com.motormindhub.Api.service.gestioneAutori.exception.RegolaDiDominioViolataException.class,
            com.motormindhub.Api.service.gestioneAmministrazioneUtenti.exception.RegolaDiDominioViolataException.class,
            TokenNonValidoException.class
    })
    public ResponseEntity<ErrorResponseDTO> handleBadRequest(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDTO.of(HttpStatus.BAD_REQUEST.value(), "Bad Request", ex.getMessage()));
    }

    /** RNF9.3: distinto da handleBadRequest/TokenNonValidoException per un futuro flusso di reinvio del link. */
    @ExceptionHandler(TokenVerificaScadutoException.class)
    public ResponseEntity<ErrorResponseDTO> handleTokenVerificaScaduto(TokenVerificaScadutoException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDTO.of(HttpStatus.BAD_REQUEST.value(), "Bad Request",
                        ex.getMessage(), "TOKEN_VERIFICA_SCADUTO"));
    }

    /**
     * BadCredentialsException/DisabledException/LockedException sono le tre sottoclassi di
     * AuthenticationException che AuthenticationManager.authenticate() puo' sollevare per un
     * login fallito (cfr. UserPrincipal, AccountStatusUserDetailsChecker di Spring Security):
     * rispettivamente credenziali errate, account non ancora verificato (stato != ATTIVO), account
     * bloccato/sospeso (isAccountNonLocked() = false). Handler dedicati - invece del solo fallback
     * generico sotto - cosi' il client puo' distinguerle via errorCode (RAD UC_2.1-2.3: tre UX
     * diverse, non un unico "credenziali non valide" per tutto). Nota: LockedException copre sia la
     * sospensione amministrativa sia il blocco anti-bruteforce (RNF2.6) - Spring non li distingue a
     * questo livello (isAccountNonLocked() e' un singolo booleano), quindi restano un'unica categoria
     * "ACCOUNT_BLOCCATO" anche qui.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponseDTO> handleCredenzialiNonValide(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponseDTO.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized",
                        "Credenziali non valide.", "CREDENZIALI_NON_VALIDE"));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccountNonVerificato(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponseDTO.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized",
                        "Il tuo account non e' ancora stato verificato. Controlla la tua casella email per attivarlo.",
                        "ACCOUNT_NON_VERIFICATO"));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccountBloccato(LockedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponseDTO.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized",
                        "Il tuo account e' bloccato o sospeso. Controlla la tua email per le istruzioni.",
                        "ACCOUNT_BLOCCATO"));
    }

    /** Fallback per altre sottoclassi di AuthenticationException non gestite sopra (es. AccountExpiredException, non usata oggi). */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponseDTO> handleAutenticazione(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponseDTO.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized",
                        "Credenziali non valide.", "CREDENZIALI_NON_VALIDE"));
    }

    @ExceptionHandler(RefreshTokenNonValidoException.class)
    public ResponseEntity<ErrorResponseDTO> handleRefreshTokenNonValido(RefreshTokenNonValidoException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponseDTO.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized", ex.getMessage()));
    }

    /** LoginRateLimiter (rate limit per email su /auth/login, distinto dal blocco per-account RNF2.6). */
    @ExceptionHandler(TroppiTentativiLoginException.class)
    public ResponseEntity<ErrorResponseDTO> handleTroppiTentativiLogin(TroppiTentativiLoginException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(ErrorResponseDTO.of(HttpStatus.TOO_MANY_REQUESTS.value(), "Too Many Requests", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidazione(MethodArgumentNotValidException ex) {
        List<String> messaggi = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getDefaultMessage())
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDTO.of(HttpStatus.BAD_REQUEST.value(), "Bad Request", messaggi));
    }

    /**
     * Corpo della richiesta JSON malformato, illeggibile, o con un valore che non corrisponde al
     * tipo atteso (es. un valore enum inesistente, una stringa dove e' atteso un numero). Prima
     * dell'introduzione di questo handler, l'eccezione non veniva gestita da nessun
     * @ExceptionHandler: ricadeva sul comportamento di default di Spring MVC
     * (DefaultHandlerExceptionResolver -&gt; response.sendError(400) -&gt; forward interno a /error),
     * che in questa configurazione di sicurezza produceva un 403 vuoto - identico sia con sia senza
     * autenticazione, quindi non un problema di autorizzazione ma di gestione delle eccezioni
     * mancante. Il messaggio restituito e' generico (non il messaggio originale di Jackson, che
     * espone nomi di classi Java interne) per non trapelare dettagli implementativi al client.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleBodyNonLeggibile(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDTO.of(HttpStatus.BAD_REQUEST.value(), "Bad Request",
                        "Il corpo della richiesta e' malformato o contiene un valore non valido per uno dei campi."));
    }

    /**
     * AccessDeniedException (sollevata da @PreAuthorize durante l'invocazione di un metodo
     * controller, cfr. SecurityConfig @EnableMethodSecurity) e' normalmente lasciata risalire non
     * gestita da questa classe, cosi' che esca da DispatcherServlet e venga intercettata da
     * ExceptionTranslationFilter -&gt; RestAccessDeniedHandler (stesso status/messaggio replicati qui).
     * Un handler esplicito e' comunque necessario ora che esiste handleErroreInterno sotto: senza,
     * quel catch-all (l'unico match disponibile per ExceptionHandlerExceptionResolver, in assenza di
     * un handler piu' specifico) la intercetterebbe per primo e la trasformerebbe in un 500 invece
     * del 403 di autorizzazione atteso.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccessoNegato(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponseDTO.of(HttpStatus.FORBIDDEN.value(), "Forbidden",
                        "Permessi insufficienti per accedere a questa risorsa."));
    }

    /**
     * Fallback generico per qualunque RuntimeException non gestita esplicitamente sopra (bug
     * applicativo, errore del database non mappato a un'eccezione di dominio, ecc.). Stesso
     * ragionamento del commento su handleBodyNonLeggibile: senza questo handler l'eccezione
     * ricadrebbe sul dispatch di default verso /error (DispatcherType.ERROR); per una richiesta
     * originariamente non autenticata su un endpoint permitAll, quel secondo passaggio nella filter
     * chain di sicurezza (vedi SecurityConfig, .dispatcherTypeMatchers(ERROR).permitAll() la rende
     * comunque innocua come ulteriore rete di sicurezza) veniva intercettato da
     * RestAuthenticationEntryPoint prima ancora di arrivare qui - un 500 reale finiva mascherato da
     * un 401, facendo credere a un client che si fida dello status code che serva un login, non che
     * ci sia un bug da segnalare. Il messaggio e' generico per non esporre dettagli implementativi
     * (stack trace, nomi di classi Java interne) al client.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleErroreInterno(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponseDTO.of(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal Server Error",
                        "Si e' verificato un errore interno. Riprova piu' tardi."));
    }
}
