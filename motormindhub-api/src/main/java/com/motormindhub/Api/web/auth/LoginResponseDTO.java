package com.motormindhub.Api.web.auth;

public record LoginResponseDTO(String accessToken, String refreshToken, String tokenType) {

    public LoginResponseDTO(String accessToken, String refreshToken) {
        this(accessToken, refreshToken, "Bearer");
    }
}
