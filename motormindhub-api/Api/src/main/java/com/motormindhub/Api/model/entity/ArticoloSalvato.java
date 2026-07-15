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
 * Riga di associazione Utente-Articolo per le liste personali "Preferiti"/"Leggi più tardi"
 * (RF1.7, RF1.8, ODD 2.2). Invariante: la tripla (utente, articolo, tipoLista) e' unica - garantita
 * dal vincolo UNIQUE della tabella e verificata esplicitamente in saveArticleToList.
 */
@Entity
@Table(name = "articoli_salvati")
public class ArticoloSalvato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utente_id", nullable = false)
    private Utente utente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "articolo_id", nullable = false)
    private Articolo articolo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_lista", nullable = false, length = 30)
    private TipoLista tipoLista;

    @Column(name = "data_salvataggio", nullable = false, updatable = false)
    private Instant dataSalvataggio;

    protected ArticoloSalvato() {
        // richiesto da JPA
    }

    public ArticoloSalvato(Utente utente, Articolo articolo, TipoLista tipoLista) {
        this.utente = utente;
        this.articolo = articolo;
        this.tipoLista = tipoLista;
        this.dataSalvataggio = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Utente getUtente() {
        return utente;
    }

    public Articolo getArticolo() {
        return articolo;
    }

    public TipoLista getTipoLista() {
        return tipoLista;
    }

    public Instant getDataSalvataggio() {
        return dataSalvataggio;
    }
}
