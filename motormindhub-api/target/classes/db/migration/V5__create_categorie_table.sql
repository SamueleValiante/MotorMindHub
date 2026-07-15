CREATE TABLE categorie (
    id                  BIGSERIAL PRIMARY KEY,
    nome                VARCHAR(150) NOT NULL,
    descrizione         VARCHAR(2000),
    categoria_padre_id  BIGINT REFERENCES categorie (id)
);

CREATE INDEX idx_categorie_padre ON categorie (categoria_padre_id);
