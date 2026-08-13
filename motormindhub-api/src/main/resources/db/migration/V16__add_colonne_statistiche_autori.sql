-- Colonne di supporto per le statistiche della dashboard Manager Autori (RF3.1, ODD 2.4):
-- andamentoPubblicazioni/andamentoApprovazioni (data_decisione) e andamentoCategorie (data_creazione).

-- Nullable: nessun backfill possibile per le decisioni gia' prese prima di questa migrazione (il
-- timestamp esatto non e' mai stato registrato) - quegli articoli restano semplicemente assenti
-- dalle serie storiche, invece di comparire con una data inventata.
ALTER TABLE articoli ADD COLUMN data_decisione TIMESTAMPTZ;
CREATE INDEX idx_articoli_data_decisione ON articoli (data_decisione);

-- NOT NULL, a differenza di data_decisione: qui il backfill con "adesso" e' l'unica scelta
-- possibile per rispettare l'invariante (ogni categoria ha sempre una data di creazione), al prezzo
-- di attribuire alle categorie preesistenti la data di questa migrazione invece della loro data
-- reale (mai registrata finora).
ALTER TABLE categorie ADD COLUMN data_creazione TIMESTAMPTZ;
UPDATE categorie SET data_creazione = now() WHERE data_creazione IS NULL;
ALTER TABLE categorie ALTER COLUMN data_creazione SET NOT NULL;
CREATE INDEX idx_categorie_data_creazione ON categorie (data_creazione);
