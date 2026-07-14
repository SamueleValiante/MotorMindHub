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
 * Richiesta di cancellazione account - diritto all'oblio (RF1.10, RNF5.5, ODD 2.1 requestAccountDeletion).
 * L'elaborazione (processAccountDeletion) e' di competenza di GestioneAmministrazioneUtenti.
 */
@Entity
@Table(name = "richieste_cancellazione")
public class RichiestaCancellazione {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utente_id", nullable = false)
    private Utente utente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatoRichiestaCancellazione stato;

    @Column(name = "data_richiesta", nullable = false, updatable = false)
    private Instant dataRichiesta;

    protected RichiestaCancellazione() {
        // richiesto da JPA
    }

    public RichiestaCancellazione(Utente utente) {
        this.utente = utente;
        this.stato = StatoRichiestaCancellazione.IN_CODA;
        this.dataRichiesta = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Utente getUtente() {
        return utente;
    }

    public StatoRichiestaCancellazione getStato() {
        return stato;
    }

    public void setStato(StatoRichiestaCancellazione stato) {
        this.stato = stato;
    }

    public Instant getDataRichiesta() {
        return dataRichiesta;
    }
}
