CREATE TABLE log_azioni_amministrative (
    id               BIGSERIAL PRIMARY KEY,
    utente_target_id BIGINT NOT NULL REFERENCES utenti (id),
    tipo_azione      VARCHAR(30) NOT NULL,
    dettaglio        VARCHAR(500),
    data_azione      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_log_azioni_amministrative_utente_target ON log_azioni_amministrative (utente_target_id);
CREATE INDEX idx_log_azioni_amministrative_tipo_azione ON log_azioni_amministrative (tipo_azione);
