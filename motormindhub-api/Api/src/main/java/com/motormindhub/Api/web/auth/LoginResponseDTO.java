package com.motormindhub.Api.web.auth;

public record LoginResponseDTO(String accessToken, String tokenType) {

    public LoginResponseDTO(String accessToken) {
        this(accessToken, "Bearer");
    }
}
