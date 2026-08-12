CREATE TABLE visite_sessione (
    id             BIGSERIAL PRIMARY KEY,
    sessione_id    VARCHAR(36) NOT NULL UNIQUE,
    tipo           VARCHAR(20) NOT NULL,
    data_visita    TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_visite_sessione_data_visita ON visite_sessione (data_visita);
