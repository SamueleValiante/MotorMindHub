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
 * Voce di cronologia amministrativa (RF4.8, ODD 2.5): sospensioni, riattivazioni, cancellazioni ed
 * esportazioni compiute dal Gestore Utenti su un account.
 *
 * Nota di scope: non e' presente un campo "operatore" (chi ha compiuto l'azione). Nessuno dei
 * contratti OCL di GestioneAmministrazioneUtenti (ODD 2.5) lo richiede, e nessun sottosistema
 * esistente fa transitare l'identita' dell'attore attraverso il Service Layer per azioni compiute su
 * un'altra entita' (cfr. GestioneAutori.inviteAuthor/removeAuthor/approveArticle, ODD 2.4): farlo qui
 * significherebbe deviare dalle firme documentate nell'ODD senza un precedente nel resto del
 * back-end. La tracciabilita' per-operatore (mockup 48_gestore_cronologia.png) resta quindi affidata
 * ai log applicativi/HTTP a livello di infrastruttura, fuori dallo scope di questo sottosistema.
 */
@Entity
@Table(name = "log_azioni_amministrative")
public class LogAzioneAmministrativa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utente_target_id", nullable = false)
    private Utente utenteTarget;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_azione", nullable = false, length = 30)
    private TipoAzioneAmministrativa tipoAzione;

    @Column(length = 500)
    private String dettaglio;

    @Column(name = "data_azione", nullable = false, updatable = false)
    private Instant dataAzione;

    protected LogAzioneAmministrativa() {
        // richiesto da JPA
    }

    public LogAzioneAmministrativa(Utente utenteTarget, TipoAzioneAmministrativa tipoAzione, String dettaglio) {
        this.utenteTarget = utenteTarget;
        this.tipoAzione = tipoAzione;
        this.dettaglio = dettaglio;
        this.dataAzione = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Utente getUtenteTarget() {
        return utenteTarget;
    }

    public TipoAzioneAmministrativa getTipoAzione() {
        return tipoAzione;
    }

    public String getDettaglio() {
        return dettaglio;
    }

    public Instant getDataAzione() {
        return dataAzione;
    }
}
