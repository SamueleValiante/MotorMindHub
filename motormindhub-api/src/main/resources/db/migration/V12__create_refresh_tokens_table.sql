CREATE TABLE refresh_tokens (
    id              BIGSERIAL PRIMARY KEY,
    utente_id       BIGINT NOT NULL REFERENCES utenti (id),
    token_hash      VARCHAR(64) NOT NULL,
    data_scadenza   TIMESTAMPTZ NOT NULL,
    revocato        BOOLEAN NOT NULL DEFAULT FALSE,
    data_creazione  TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_utente ON refresh_tokens (utente_id);
