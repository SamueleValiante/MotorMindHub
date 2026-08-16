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
 * Log delle letture di un articolo (RF1.1, ODD 2.2 getArticleById): una riga a ogni incremento
 * reale di {@link Articolo#getNumeroVisualizzazioni()}, stessa condizione Guest/Iscritto già
 * applicata lì. Non sostituisce numeroVisualizzazioni (resta il contatore rapido per card/liste) -
 * è un log aggiuntivo, scritto nella stessa transazione (ODD 2.4 andamentoLetture).
 */
@Entity
@Table(name = "visualizzazioni_articolo")
public class VisualizzazioneArticolo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "articolo_id", nullable = false)
    private Articolo articolo;

    @Column(name = "data_lettura", nullable = false, updatable = false)
    private Instant dataLettura;

    protected VisualizzazioneArticolo() {
        // richiesto da JPA
    }

    public VisualizzazioneArticolo(Articolo articolo) {
        this.articolo = articolo;
        this.dataLettura = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Articolo getArticolo() {
        return articolo;
    }

    public Instant getDataLettura() {
        return dataLettura;
    }
}
