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
 * Invito a diventare Autore/Manager Autori (RF3.3, ODD 2.4). Invariante di sottosistema: non
 * possono coesistere due inviti in stato INVIATO per lo stesso indirizzo email - verificato
 * esplicitamente da GestioneAutori.inviteAuthor prima della creazione.
 * Porta con se' nome/cognome/email/ruoloProposto perche' acceptInvite deve poter costruire il
 * nuovo Utente (ODD 2.4) senza ulteriori dati in ingresso oltre alla password scelta dall'invitato.
 */
@Entity
@Table(name = "inviti_autore")
public class InvitoAutore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 100)
    private String cognome;

    @Column(nullable = false, length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "ruolo_proposto", nullable = false, length = 30)
    private Ruolo ruoloProposto;

    @Column(nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatoInvito stato;

    @Column(name = "data_invio", nullable = false, updatable = false)
    private Instant dataInvio;

    @Column(name = "data_scadenza", nullable = false)
    private Instant dataScadenza;

    protected InvitoAutore() {
        // richiesto da JPA
    }

    public InvitoAutore(String nome, String cognome, String email, Ruolo ruoloProposto, String token, Instant dataScadenza) {
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.ruoloProposto = ruoloProposto;
        this.token = token;
        this.stato = StatoInvito.INVIATO;
        this.dataInvio = Instant.now();
        this.dataScadenza = dataScadenza;
    }

    public void accetta() {
        this.stato = StatoInvito.ACCETTATO;
    }

    public void rifiuta() {
        this.stato = StatoInvito.RIFIUTATO;
    }

    public boolean isValido() {
        return stato == StatoInvito.INVIATO && dataScadenza.isAfter(Instant.now());
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getCognome() {
        return cognome;
    }

    public String getEmail() {
        return email;
    }

    public Ruolo getRuoloProposto() {
        return ruoloProposto;
    }

    public String getToken() {
        return token;
    }

    public StatoInvito getStato() {
        return stato;
    }

    public Instant getDataInvio() {
        return dataInvio;
    }

    public Instant getDataScadenza() {
        return dataScadenza;
    }
}
