-- Decisione di prodotto (rovescia SDD 3.3/RAD RF1.2 precedenti, aggiornati insieme a questa
-- migrazione): il corpo dell'articolo (Testo) esce dall'ambito della ricerca full-text, che resta
-- ristretta a Titolo e Tag. Postgres non supporta ALTER COLUMN ... SET EXPRESSION su una colonna
-- generata (verificato: errore di sintassi su PG 16) - l'unico modo e' DROP + ADD. DROP COLUMN
-- cancella automaticamente l'indice GIN dipendente (nessun CASCADE esplicito necessario); ADD
-- COLUMN ... GENERATED ALWAYS AS (...) STORED ricalcola da solo il valore per tutte le righe
-- esistenti (full table rewrite implicito), quindi i 13 articoli gia' pubblicati vengono
-- ricalcolati senza bisogno di un UPDATE di backfill separato.
ALTER TABLE articoli DROP COLUMN search_vector;

ALTER TABLE articoli ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('italian', coalesce(titolo, '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(tag, '')), 'B')
) STORED;

CREATE INDEX idx_articoli_search_vector ON articoli USING GIN (search_vector);
