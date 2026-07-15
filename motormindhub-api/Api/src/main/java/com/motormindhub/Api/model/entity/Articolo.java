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
 * Articolo tecnico/guida (RF2.1-RF2.4, RF2.7, ODD 2.2). Invariante di sottosistema: un articolo
 * PUBBLICATO deve sempre avere una categoria - garantito da publishArticle, che verifica la
 * presenza di categoria (e titolo) prima della transizione di stato.
 * {@code titolo}, {@code testo} e {@code categoria} sono nullable: una bozza (RF2.7) puo' essere
 * salvata incompleta (cfr. ODD 2.2 publishArticle: "not a.titolo.oclIsUndefined()" e' verificato
 * solo alla pubblicazione, non alla creazione).
 * {@code tag} e' memorizzato come singola colonna testuale delimitata da virgola (non una tabella
 * di join) perche' SDD 3.3 tratta "Tag" come una delle tre colonne piatte che alimentano il
 * tsvector generato per la ricerca full-text, insieme a Titolo e Testo.
 */
@Entity
@Table(name = "articoli")
public class Articolo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 300)
    private String titolo;

    @Column(columnDefinition = "text")
    private String testo;

    @Column(name = "immagine_copertina")
    private String immagineCopertina;

    @Column(columnDefinition = "text")
    private String tag;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "autore_id", nullable = false)
    private Utente autore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatoArticolo stato;

    @Column(name = "numero_visualizzazioni", nullable = false)
    private long numeroVisualizzazioni;

    @Column(name = "data_creazione", nullable = false, updatable = false)
    private Instant dataCreazione;

    @Column(name = "data_ultimo_aggiornamento", nullable = false)
    private Instant dataUltimoAggiornamento;

    @Column(name = "motivazione_rifiuto", columnDefinition = "text")
    private String motivazioneRifiuto;

    protected Articolo() {
        // richiesto da JPA
    }

    public Articolo(Utente autore, String titolo, String testo, Categoria categoria, String tag, String immagineCopertina) {
        this.autore = autore;
        this.titolo = titolo;
        this.testo = testo;
        this.categoria = categoria;
        this.tag = tag;
        this.immagineCopertina = immagineCopertina;
        this.stato = StatoArticolo.BOZZA;
        this.numeroVisualizzazioni = 0L;
        this.dataCreazione = Instant.now();
        this.dataUltimoAggiornamento = Instant.now();
    }

    public void aggiornaContenuto(String titolo, String testo, Categoria categoria, String tag, String immagineCopertina) {
        this.titolo = titolo;
        this.testo = testo;
        this.categoria = categoria;
        this.tag = tag;
        this.immagineCopertina = immagineCopertina;
        this.dataUltimoAggiornamento = Instant.now();
    }

    public void riassegnaCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public void incrementaVisualizzazioni() {
        this.numeroVisualizzazioni++;
    }

    /** RF3.6, UC_21 (ODD 2.4 GestioneAutori.approveArticle). */
    public void approva() {
        this.stato = StatoArticolo.PUBBLICATO;
    }

    /** RF3.6, UC_21 (ODD 2.4 GestioneAutori.rejectArticle). */
    public void rifiuta(String motivazione) {
        this.stato = StatoArticolo.RIFIUTATO;
        this.motivazioneRifiuto = motivazione;
    }

    public Long getId() {
        return id;
    }

    public String getTitolo() {
        return titolo;
    }

    public String getTesto() {
        return testo;
    }

    public String getImmagineCopertina() {
        return immagineCopertina;
    }

    public String getTag() {
        return tag;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public Utente getAutore() {
        return autore;
    }

    public StatoArticolo getStato() {
        return stato;
    }

    public void setStato(StatoArticolo stato) {
        this.stato = stato;
    }

    public long getNumeroVisualizzazioni() {
        return numeroVisualizzazioni;
    }

    public Instant getDataCreazione() {
        return dataCreazione;
    }

    public Instant getDataUltimoAggiornamento() {
        return dataUltimoAggiornamento;
    }

    public String getMotivazioneRifiuto() {
        return motivazioneRifiuto;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Articolo other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
