-- Supporta la nuova query aggregata ArticoloSalvatoRepository.countByArticoloIdIn (numeroSalvataggi
-- su "I Miei Articoli", ODD 2.2): l'unico indice esistente su articoli_salvati e' su utente_id
-- (idx_articoli_salvati_utente) e il vincolo UNIQUE (utente_id, articolo_id, tipo_lista) ha
-- utente_id come colonna guida, quindi non e' utilizzabile per un filtro/GROUP BY su articolo_id.
CREATE INDEX idx_articoli_salvati_articolo ON articoli_salvati (articolo_id);
