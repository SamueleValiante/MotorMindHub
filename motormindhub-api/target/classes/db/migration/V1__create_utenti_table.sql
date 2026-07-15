CREATE TABLE utenti (
    id                  BIGSERIAL PRIMARY KEY,
    nome                VARCHAR(100) NOT NULL,
    cognome             VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    foto_profilo        VARCHAR(2048),
    biografia           VARCHAR(1000),
    ruolo               VARCHAR(30) NOT NULL,
    stato               VARCHAR(30) NOT NULL,
    token_verifica      VARCHAR(255),
    consenso_privacy    BOOLEAN NOT NULL,
    data_registrazione  TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_utenti_email UNIQUE (email),
    CONSTRAINT uq_utenti_token_verifica UNIQUE (token_verifica)
);

CREATE INDEX idx_utenti_stato ON utenti (stato);
