package com.motormindhub.Api.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Token monouso a scadenza per il recupero password (RNF9.3, ODD 2.1 requestPasswordReset/resetPassword).
 */
@Entity
@Table(name = "token_recupero_password")
public class TokenRecuperoPassword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utente_id", nullable = false)
    private Utente utente;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "data_scadenza", nullable = false)
    private Instant dataScadenza;

    @Column(nullable = false)
    private boolean utilizzato;

    protected TokenRecuperoPassword() {
        // richiesto da JPA
    }

    public TokenRecuperoPassword(Utente utente, String token, Instant dataScadenza) {
        this.utente = utente;
        this.token = token;
        this.dataScadenza = dataScadenza;
        this.utilizzato = false;
    }

    public Long getId() {
        return id;
    }

    public Utente getUtente() {
        return utente;
    }

    public String getToken() {
        return token;
    }

    public Instant getDataScadenza() {
        return dataScadenza;
    }

    public boolean isUtilizzato() {
        return utilizzato;
    }

    public void setUtilizzato(boolean utilizzato) {
        this.utilizzato = utilizzato;
    }

    public boolean isValido() {
        return !utilizzato && dataScadenza.isAfter(Instant.now());
    }
}
