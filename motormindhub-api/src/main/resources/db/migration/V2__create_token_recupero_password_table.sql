CREATE TABLE token_recupero_password (
    id              BIGSERIAL PRIMARY KEY,
    utente_id       BIGINT NOT NULL REFERENCES utenti (id),
    token           VARCHAR(255) NOT NULL,
    data_scadenza   TIMESTAMPTZ NOT NULL,
    utilizzato      BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_token_recupero_password_token UNIQUE (token)
);

CREATE INDEX idx_token_recupero_password_utente ON token_recupero_password (utente_id);
