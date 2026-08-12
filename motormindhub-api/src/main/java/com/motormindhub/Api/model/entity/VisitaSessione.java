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
 * Una visita al sito deduplicata per sessione browser (RF3.1, UC_28), non per pagina vista:
 * sessioneId e' il valore del cookie anonimo mmh_visit_session, generato dal backend
 * (GestioneAmministrazioneUtenti.registraVisita) e senza Max-Age - si estingue alla chiusura del
 * browser, il che garantisce da solo la deduplica "una visita per sessione" senza bisogno di una
 * scadenza lato server su questa entita'.
 */
@Entity
@Table(name = "visite_sessione")
public class VisitaSessione {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sessione_id", nullable = false, unique = true, length = 36)
    private String sessioneId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoVisitatore tipo;

    @Column(name = "data_visita", nullable = false)
    private Instant dataVisita;

    protected VisitaSessione() {
        // richiesto da JPA
    }

    public VisitaSessione(String sessioneId, TipoVisitatore tipo) {
        this.sessioneId = sessioneId;
        this.tipo = tipo;
        this.dataVisita = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getSessioneId() {
        return sessioneId;
    }

    public TipoVisitatore getTipo() {
        return tipo;
    }

    public Instant getDataVisita() {
        return dataVisita;
    }
}
