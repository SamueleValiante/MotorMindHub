package com.motormindhub.Api.web.utenti;

import com.motormindhub.Api.security.UserPrincipal;
import com.motormindhub.Api.service.gestioneUtenti.GestioneUtenti;
import com.motormindhub.Api.service.gestioneUtenti.dto.NewPasswordDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.PasswordResetRequestDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.PublicProfileDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.RegisterUserDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.ReportUserDTO;
import com.motormindhub.Api.service.gestioneUtenti.dto.UpdateProfileDTO;
import com.motormindhub.Api.web.MessageResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller di GestioneUtenti (SDD 3, ODD 2.1). Responsabilita' limitata a validazione della
 * richiesta, delega al Service Layer e serializzazione della risposta in DTO.
 */
@RestController
@RequestMapping("/api/v1/utenti")
public class UtentiController {

    private final GestioneUtenti gestioneUtenti;

    public UtentiController(GestioneUtenti gestioneUtenti) {
        this.gestioneUtenti = gestioneUtenti;
    }

    @PostMapping("/registrazione")
    public ResponseEntity<MessageResponseDTO> registerUser(@Valid @RequestBody RegisterUserDTO dto) {
        gestioneUtenti.registerUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponseDTO("Registrazione completata. Controlla la tua email per attivare l'account."));
    }

    @GetMapping("/verifica-email")
    public ResponseEntity<MessageResponseDTO> verifyEmail(@RequestParam String token) {
        gestioneUtenti.verifyEmail(token);
        return ResponseEntity.ok(new MessageResponseDTO("Account attivato con successo."));
    }

    @PostMapping("/password/recupero")
    public ResponseEntity<MessageResponseDTO> requestPasswordReset(@Valid @RequestBody PasswordResetRequestDTO dto) {
        gestioneUtenti.requestPasswordReset(dto.email());
        return ResponseEntity.accepted()
                .body(new MessageResponseDTO("Se l'indirizzo email e' associato a un account attivo, riceverai le istruzioni per il recupero."));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<MessageResponseDTO> resetPassword(@RequestParam String token,
                                                              @Valid @RequestBody NewPasswordDTO dto) {
        gestioneUtenti.resetPassword(token, dto);
        return ResponseEntity.ok(new MessageResponseDTO("Password reimpostata con successo."));
    }

    @PutMapping("/me")
    public ResponseEntity<MessageResponseDTO> updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                                              @Valid @RequestBody UpdateProfileDTO dto) {
        gestioneUtenti.updateProfile(principal.getId(), dto);
        return ResponseEntity.ok(new MessageResponseDTO("Dati aggiornati correttamente."));
    }

    @GetMapping("/{userId}/profilo-pubblico")
    public ResponseEntity<PublicProfileDTO> getPublicProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(gestioneUtenti.getPublicProfile(userId));
    }

    @PostMapping("/me/esportazione-dati")
    public ResponseEntity<MessageResponseDTO> requestAccountDataExport(@AuthenticationPrincipal UserPrincipal principal) {
        gestioneUtenti.requestAccountDataExport(principal.getId());
        return ResponseEntity.accepted()
                .body(new MessageResponseDTO("Riceverai a breve un'email con il link per scaricare i tuoi dati."));
    }

    @PostMapping("/me/cancellazione")
    public ResponseEntity<MessageResponseDTO> requestAccountDeletion(@AuthenticationPrincipal UserPrincipal principal) {
        gestioneUtenti.requestAccountDeletion(principal.getId());
        return ResponseEntity.accepted()
                .body(new MessageResponseDTO("La tua richiesta di cancellazione e' stata presa in carico."));
    }

    @GetMapping("/sblocco-account")
    public ResponseEntity<MessageResponseDTO> confirmAccountUnlock(@RequestParam String token) {
        gestioneUtenti.confirmAccountUnlock(token);
        return ResponseEntity.ok(new MessageResponseDTO("Account sbloccato con successo. Ora puoi effettuare l'accesso."));
    }

    @PostMapping("/segnalazioni")
    public ResponseEntity<MessageResponseDTO> reportUser(@AuthenticationPrincipal UserPrincipal principal,
                                                           @Valid @RequestBody ReportUserDTO dto) {
        gestioneUtenti.reportUser(principal.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponseDTO("Segnalazione inviata. Il team di moderazione la esaminera' a breve."));
    }
}
