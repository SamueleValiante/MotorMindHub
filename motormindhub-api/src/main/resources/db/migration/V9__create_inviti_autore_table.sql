CREATE TABLE inviti_autore (
    id              BIGSERIAL PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    cognome         VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    ruolo_proposto  VARCHAR(30) NOT NULL,
    token           VARCHAR(255) NOT NULL,
    stato           VARCHAR(30) NOT NULL,
    data_invio      TIMESTAMPTZ NOT NULL,
    data_scadenza   TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_inviti_autore_token UNIQUE (token)
);

CREATE INDEX idx_inviti_autore_email_stato ON inviti_autore (email, stato);
