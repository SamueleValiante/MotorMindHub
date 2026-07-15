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

    /*
     * Campi anti-bruteforce (RNF2.6): non fanno parte dell'invariante o dei contratti OCL di
     * GestioneUtenti (ODD 2.1), che non modella *authenticate (delegato alla filter chain di Spring
     * Security - vedi GestioneUtenti javadoc). Il conteggio dei tentativi falliti e il blocco
     * temporaneo sono comunque richiesti esplicitamente dal RAD (RNF2.6, UC_2.2) e vengono innestati
     * sugli eventi di autenticazione di Spring Security (vedi security.LoginAttemptListener).
     */
    @Column(name = "tentativi_falliti", nullable = false)
    private int tentativiFalliti = 0;

    @Column(name = "bloccato_fino")
    private Instant bloccatoFino;

    @Column(name = "token_sblocco", unique = true)
    private String tokenSblocco;

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

    public int getTentativiFalliti() {
        return tentativiFalliti;
    }

    public Instant getBloccatoFino() {
        return bloccatoFino;
    }

    public String getTokenSblocco() {
        return tokenSblocco;
    }

    /** RNF2.6: incrementa il contatore dopo un tentativo di login fallito. */
    public void registraTentativoFallito() {
        this.tentativiFalliti++;
    }

    /** RNF2.6: azzera il contatore dopo un login riuscito. */
    public void resetTentativiFalliti() {
        this.tentativiFalliti = 0;
    }

    /** RNF2.6: blocca temporaneamente l'account, generando il token da usare nell'email di sblocco. */
    public void bloccaAccount(String tokenSblocco, Instant bloccatoFino) {
        this.tokenSblocco = tokenSblocco;
        this.bloccatoFino = bloccatoFino;
    }

    /** RNF2.6: true se il blocco per tentativi falliti e' attualmente in vigore. */
    public boolean isBloccato() {
        return bloccatoFino != null && bloccatoFino.isAfter(Instant.now());
    }

    /** RNF2.6: sblocco anticipato via link di conferma email, oppure scadenza naturale del blocco. */
    public void sbloccaAccount() {
        this.bloccatoFino = null;
        this.tentativiFalliti = 0;
        this.tokenSblocco = null;
    }

    /**
     * RF4.6, RNF5.5 (diritto all'oblio): scrubbing irreversibile dei dati personali, mantenendo la
     * riga per l'integrita' referenziale verso segnalazioni/richieste di cancellazione/cronologia
     * amministrativa (vedi GestioneAmministrazioneUtenti.processAccountDeletion, ODD 2.5, per il
     * ragionamento completo).
     *
     * nome/cognome vengono sovrascritti con la stessa etichetta generica per tutti gli account
     * anonimizzati (non un valore derivato dall'originale): questo li rende indistinguibili tra loro,
     * non solo "diversi da prima". L'email e' resa un placeholder univoco basato su un UUID casuale
     * (non sull'id incrementale dell'utente, che sarebbe enumerabile/prevedibile e correlabile
     * all'ordine di cancellazione) - necessario comunque per non violare il vincolo NOT NULL/UNIQUE
     * della colonna, dato che una nuova registrazione con la stessa email va permessa in futuro.
     * passwordHash e' svuotato: BCryptPasswordEncoder.matches(...) tratta esplicitamente una stringa
     * vuota come "nessuna corrispondenza" (non lancia eccezioni), quindi l'account resta
     * permanentemente non autenticabile anche solo per questo, indipendentemente dal fatto che
     * isEnabled()/isAccountNonLocked() (UserPrincipal) blocchino gia' l'accesso prima del controllo
     * password. tokenVerifica non viene toccato qui perche' gia' nullo per qualunque account ATTIVO
     * (svuotato da verifyEmail, ODD 2.1) - l'unico stato da cui si puo' arrivare a una cancellazione.
     */
    public void anonimizza() {
        this.nome = "Utente";
        this.cognome = "cancellato";
        this.email = "utente-cancellato-" + java.util.UUID.randomUUID() + "@deleted.motormindhub.local";
        this.passwordHash = "";
        this.fotoProfilo = null;
        this.biografia = null;
        this.stato = StatoUtente.IN_CANCELLAZIONE;
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
