package com.motormindhub.Api.web;

import com.motormindhub.Api.security.exception.RefreshTokenNonValidoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.AccountNonAttivoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.EmailGiaRegistrataException;
import com.motormindhub.Api.service.gestioneUtenti.exception.RichiestaCancellazioneEsistenteException;
import com.motormindhub.Api.service.gestioneUtenti.exception.TokenNonValidoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.UtenteNonTrovatoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
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

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponseDTO> handleAutenticazione(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponseDTO.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized", "Credenziali non valide."));
    }

    @ExceptionHandler(RefreshTokenNonValidoException.class)
    public ResponseEntity<ErrorResponseDTO> handleRefreshTokenNonValido(RefreshTokenNonValidoException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponseDTO.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized", ex.getMessage()));
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
}
