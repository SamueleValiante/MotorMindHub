package com.motormindhub.Api.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Segnalazione di un profilo/contenuto da parte di un Iscritto (RF1.9, ODD 2.1 reportUser).
 * La coda di lavorazione (resolveReport) e' di competenza di GestioneAmministrazioneUtenti.
 */
@Entity
@Table(name = "segnalazioni")
public class Segnalazione {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "segnalante_id", nullable = false)
    private Utente segnalante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "segnalato_id", nullable = false)
    private Utente segnalato;

    @Column(nullable = false, length = 2000)
    private String motivazione;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatoSegnalazione stato;

    @Column(name = "data_creazione", nullable = false, updatable = false)
    private Instant dataCreazione;

    protected Segnalazione() {
        // richiesto da JPA
    }

    public Segnalazione(Utente segnalante, Utente segnalato, String motivazione) {
        this.segnalante = segnalante;
        this.segnalato = segnalato;
        this.motivazione = motivazione;
        this.stato = StatoSegnalazione.APERTA;
        this.dataCreazione = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Utente getSegnalante() {
        return segnalante;
    }

    public Utente getSegnalato() {
        return segnalato;
    }

    public String getMotivazione() {
        return motivazione;
    }

    public StatoSegnalazione getStato() {
        return stato;
    }

    public void setStato(StatoSegnalazione stato) {
        this.stato = stato;
    }

    public Instant getDataCreazione() {
        return dataCreazione;
    }
}
