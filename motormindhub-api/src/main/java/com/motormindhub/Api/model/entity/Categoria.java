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

/**
 * Nodo dell'albero gerarchico di navigazione dei contenuti (RF2.5, RF2.6, RF3.5, ODD 2.3).
 * Invariante di sottosistema: una categoria non puo' essere padre di se stessa - garantito per
 * costruzione, dato che {@link #categoriaPadre} e' assegnabile solo alla creazione (nessun setter)
 * e non puo' quindi mai referenziare un id che, a quel punto, non esiste ancora.
 * Nome e categoria padre sono immutabili dopo la creazione: updateCategory (RF2.6) puo' modificare
 * solo il testo descrittivo, non la posizione nell'albero.
 */
@Entity
@Table(name = "categorie")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 2000)
    private String descrizione;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_padre_id")
    private Categoria categoriaPadre;

    protected Categoria() {
        // richiesto da JPA
    }

    public Categoria(String nome, String descrizione, Categoria categoriaPadre) {
        this.nome = nome;
        this.descrizione = descrizione;
        this.categoriaPadre = categoriaPadre;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getDescrizione() {
        return descrizione;
    }

    public void setDescrizione(String descrizione) {
        this.descrizione = descrizione;
    }

    public Categoria getCategoriaPadre() {
        return categoriaPadre;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Categoria other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
