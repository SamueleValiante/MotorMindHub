CREATE TABLE articoli_salvati (
    id                  BIGSERIAL PRIMARY KEY,
    utente_id           BIGINT NOT NULL REFERENCES utenti (id),
    articolo_id         BIGINT NOT NULL REFERENCES articoli (id),
    tipo_lista          VARCHAR(30) NOT NULL,
    data_salvataggio    TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_articoli_salvati UNIQUE (utente_id, articolo_id, tipo_lista)
);

CREATE INDEX idx_articoli_salvati_utente ON articoli_salvati (utente_id);
