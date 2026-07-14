package com.motormindhub.Api.web;

import com.motormindhub.Api.service.gestioneUtenti.exception.AccountNonAttivoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.EmailGiaRegistrataException;
import com.motormindhub.Api.service.gestioneUtenti.exception.RichiestaCancellazioneEsistenteException;
import com.motormindhub.Api.service.gestioneUtenti.exception.TokenNonValidoException;
import com.motormindhub.Api.service.gestioneUtenti.exception.UtenteNonTrovatoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
            com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaNonTrovataException.class
    })
    public ResponseEntity<ErrorResponseDTO> handleNonTrovato(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponseDTO.of(HttpStatus.NOT_FOUND.value(), "Not Found", ex.getMessage()));
    }

    @ExceptionHandler({
            EmailGiaRegistrataException.class,
            RichiestaCancellazioneEsistenteException.class,
            com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaGiaEsistenteException.class,
            com.motormindhub.Api.service.gestioneCategorie.exception.CategoriaConSottocategorieException.class
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

    @ExceptionHandler({
            com.motormindhub.Api.service.gestioneUtenti.exception.RegolaDiDominioViolataException.class,
            com.motormindhub.Api.service.gestioneCategorie.exception.RegolaDiDominioViolataException.class,
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

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidazione(MethodArgumentNotValidException ex) {
        List<String> messaggi = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getDefaultMessage())
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponseDTO.of(HttpStatus.BAD_REQUEST.value(), "Bad Request", messaggi));
    }
}
