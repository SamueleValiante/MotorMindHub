package com.motormindhub.Api.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Unica entita' per tutti i ruoli persistiti (SDD 3.3): i permessi sono espressi dal campo
 * {@link #ruolo}, non da una gerarchia di ereditarieta' JPA. Il Guest non e' rappresentato qui.
 * Invariante di sottosistema (ODD 2.1): l'email e' univoca tra tutti gli utenti registrati -
 * garantita dal vincolo UNIQUE sulla colonna e da {@code @EmailUnivoca} a livello di DTO.
 */
@Entity
@Table(name = "utenti")
public class Utente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 100)
    private String cognome;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "foto_profilo")
    private String fotoProfilo;

    @Column(length = 1000)
    private String biografia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Ruolo ruolo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatoUtente stato;

    @Column(name = "token_verifica", unique = true)
    private String tokenVerifica;

    @Column(name = "consenso_privacy", nullable = false)
    private boolean consensoPrivacy;

    @Column(name = "data_registrazione", nullable = false, updatable = false)
    private Instant dataRegistrazione;

    protected Utente() {
        // richiesto da JPA
    }

    public Utente(String nome, String cognome, String email, String passwordHash,
                  String fotoProfilo, String biografia, boolean consensoPrivacy, String tokenVerifica) {
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fotoProfilo = fotoProfilo;
        this.biografia = biografia;
        this.consensoPrivacy = consensoPrivacy;
        this.tokenVerifica = tokenVerifica;
        this.ruolo = Ruolo.ISCRITTO;
        this.stato = StatoUtente.NON_VERIFICATO;
        this.dataRegistrazione = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCognome() {
        return cognome;
    }

    public void setCognome(String cognome) {
        this.cognome = cognome;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getFotoProfilo() {
        return fotoProfilo;
    }

    public void setFotoProfilo(String fotoProfilo) {
        this.fotoProfilo = fotoProfilo;
    }

    public String getBiografia() {
        return biografia;
    }

    public void setBiografia(String biografia) {
        this.biografia = biografia;
    }

    public Ruolo getRuolo() {
        return ruolo;
    }

    public void setRuolo(Ruolo ruolo) {
        this.ruolo = ruolo;
    }

    public StatoUtente getStato() {
        return stato;
    }

    public void setStato(StatoUtente stato) {
        this.stato = stato;
    }

    public String getTokenVerifica() {
        return tokenVerifica;
    }

    public void setTokenVerifica(String tokenVerifica) {
        this.tokenVerifica = tokenVerifica;
    }

    public boolean isConsensoPrivacy() {
        return consensoPrivacy;
    }

    public Instant getDataRegistrazione() {
        return dataRegistrazione;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Utente other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
