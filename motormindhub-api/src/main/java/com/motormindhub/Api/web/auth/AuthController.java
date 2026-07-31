package com.motormindhub.Api.web.auth;

import com.motormindhub.Api.model.entity.Utente;
import com.motormindhub.Api.security.JwtTokenProvider;
import com.motormindhub.Api.security.LoginRateLimiter;
import com.motormindhub.Api.security.RefreshTokenService;
import com.motormindhub.Api.security.UserPrincipal;
import com.motormindhub.Api.web.MessageResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * *authenticate non e' implementato nel Service Layer di GestioneUtenti (ODD 2.1): la verifica
 * delle credenziali e' delegata nativamente alla filter chain di Spring Security (AuthenticationManager);
 * questo controller si limita a invocarla e a emettere l'access token JWT e il refresh token opaco
 * (RNF9.2). refresh e logout sono pubblici a livello HTTP (SecurityConfig): l'intero scopo di
 * /refresh e' ottenere un nuovo access token quando quello corrente e' scaduto, quindi non puo'
 * richiedere un Authorization header valido - la sicurezza e' data dal possesso del refresh token
 * stesso (verificato in RefreshTokenService), non da un filtro a monte.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final LoginRateLimiter loginRateLimiter;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider,
                           RefreshTokenService refreshTokenService, LoginRateLimiter loginRateLimiter) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.loginRateLimiter = loginRateLimiter;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        loginRateLimiter.checkAndConsume(dto.email());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.email(), dto.password()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String accessToken = jwtTokenProvider.generateToken(principal);
        String refreshToken = refreshTokenService.generate(principal.getId());

        return ResponseEntity.ok(new LoginResponseDTO(accessToken, refreshToken));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponseDTO> refresh(@Valid @RequestBody RefreshTokenRequestDTO dto) {
        Utente utente = refreshTokenService.rotate(dto.refreshToken());

        String accessToken = jwtTokenProvider.generateToken(new UserPrincipal(utente));
        String nuovoRefreshToken = refreshTokenService.generate(utente.getId());

        return ResponseEntity.ok(new LoginResponseDTO(accessToken, nuovoRefreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponseDTO> logout(@Valid @RequestBody RefreshTokenRequestDTO dto) {
        refreshTokenService.revoke(dto.refreshToken());
        return ResponseEntity.ok(new MessageResponseDTO("Logout effettuato con successo."));
    }
}
