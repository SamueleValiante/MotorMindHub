CREATE TABLE richieste_cancellazione (
    id              BIGSERIAL PRIMARY KEY,
    utente_id       BIGINT NOT NULL REFERENCES utenti (id),
    stato           VARCHAR(30) NOT NULL,
    data_richiesta  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_richieste_cancellazione_stato ON richieste_cancellazione (stato);
