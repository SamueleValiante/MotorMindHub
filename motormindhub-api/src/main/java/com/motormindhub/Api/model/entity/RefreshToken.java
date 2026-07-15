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
 * Refresh token opaco (RNF9.2): a differenza dell'access token JWT (JwtTokenProvider), non e'
 * auto-contenuto ne' verificabile via firma - e' un valore casuale ad alta entropia, persistito qui
 * solo nella sua forma con hash (SHA-256, vedi security.RefreshTokenService), mai in chiaro. La
 * revoca esplicita (rotation al refresh, invalidazione al logout) richiede uno stato server-side
 * consultabile, cosa che un JWT stateless non permette senza una blocklist - da qui la scelta di un
 * meccanismo separato invece di un secondo JWT a vita piu' lunga.
 */
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utente_id", nullable = false)
    private Utente utente;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "data_scadenza", nullable = false)
    private Instant dataScadenza;

    @Column(nullable = false)
    private boolean revocato;

    @Column(name = "data_creazione", nullable = false, updatable = false)
    private Instant dataCreazione;

    protected RefreshToken() {
        // richiesto da JPA
    }

    public RefreshToken(Utente utente, String tokenHash, Instant dataScadenza) {
        this.utente = utente;
        this.tokenHash = tokenHash;
        this.dataScadenza = dataScadenza;
        this.revocato = false;
        this.dataCreazione = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Utente getUtente() {
        return utente;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public Instant getDataScadenza() {
        return dataScadenza;
    }

    public boolean isRevocato() {
        return revocato;
    }

    public Instant getDataCreazione() {
        return dataCreazione;
    }

    /** Invalidazione esplicita (rotation al refresh, o logout - RNF9.2). */
    public void revoca() {
        this.revocato = true;
    }

    public boolean isValido() {
        return !revocato && dataScadenza.isAfter(Instant.now());
    }
}
