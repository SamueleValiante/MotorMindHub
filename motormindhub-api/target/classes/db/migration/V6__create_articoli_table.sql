CREATE TABLE articoli (
    id                          BIGSERIAL PRIMARY KEY,
    titolo                      VARCHAR(300),
    testo                       TEXT,
    immagine_copertina          VARCHAR(2048),
    tag                         TEXT,
    categoria_id                BIGINT REFERENCES categorie (id),
    autore_id                   BIGINT NOT NULL REFERENCES utenti (id),
    stato                       VARCHAR(30) NOT NULL,
    numero_visualizzazioni      BIGINT NOT NULL DEFAULT 0,
    data_creazione              TIMESTAMPTZ NOT NULL,
    data_ultimo_aggiornamento   TIMESTAMPTZ NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('italian', coalesce(titolo, '')), 'A') ||
        setweight(to_tsvector('italian', coalesce(tag, '')), 'B') ||
        setweight(to_tsvector('italian', coalesce(testo, '')), 'C')
    ) STORED
);

-- Ricerca full-text nativa PostgreSQL (SDD 3.3): evita un motore di indicizzazione esterno
-- (es. Elasticsearch), sproporzionato per i volumi attesi (RNF3.3).
CREATE INDEX idx_articoli_search_vector ON articoli USING GIN (search_vector);
CREATE INDEX idx_articoli_stato ON articoli (stato);
CREATE INDEX idx_articoli_categoria ON articoli (categoria_id);
CREATE INDEX idx_articoli_autore ON articoli (autore_id);
