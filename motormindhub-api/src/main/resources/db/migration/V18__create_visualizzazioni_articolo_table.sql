-- Log delle letture di articolo (ODD 2.2 getArticleById, ODD 2.4 andamentoLetture): una riga a ogni
-- incremento reale di articoli.numero_visualizzazioni (stessa condizione Guest/Iscritto gia'
-- applicata li'). Non sostituisce numero_visualizzazioni (resta il contatore rapido per
-- card/liste) - e' un log aggiuntivo, scritto nella stessa transazione.
CREATE TABLE visualizzazioni_articolo (
    id             BIGSERIAL PRIMARY KEY,
    articolo_id    BIGINT NOT NULL REFERENCES articoli (id),
    data_lettura   TIMESTAMPTZ NOT NULL
);

-- Query di aggregazione giornaliera (andamentoLetture).
CREATE INDEX idx_visualizzazioni_articolo_data_lettura ON visualizzazioni_articolo (data_lettura);

-- Nessun ON DELETE CASCADE su articolo_id (stessa scelta deliberata di articoli_salvati: cleanup
-- esplicito a livello applicativo in GestioneArticoli.deleteArticle, non implicito nello schema).
-- L'indice serve sia a quella deleteByArticoloId sia a un'eventuale futura query per singolo articolo.
CREATE INDEX idx_visualizzazioni_articolo_articolo_id ON visualizzazioni_articolo (articolo_id);
