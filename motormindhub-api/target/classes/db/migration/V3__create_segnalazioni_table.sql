CREATE TABLE segnalazioni (
    id              BIGSERIAL PRIMARY KEY,
    segnalante_id   BIGINT NOT NULL REFERENCES utenti (id),
    segnalato_id    BIGINT NOT NULL REFERENCES utenti (id),
    motivazione     VARCHAR(2000) NOT NULL,
    stato           VARCHAR(30) NOT NULL,
    data_creazione  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_segnalazioni_stato ON segnalazioni (stato);
CREATE INDEX idx_segnalazioni_segnalato ON segnalazioni (segnalato_id);
