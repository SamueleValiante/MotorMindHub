-- Aggregazione giornaliera per il grafico "Nuove registrazioni" della dashboard Gestore Utenti
-- (RF4.1): senza indice, GROUP BY su data_registrazione forza uno scan sequenziale dell'intera
-- tabella utenti ad ogni caricamento. Stesso pattern di idx_visite_sessione_data_visita (V14).
CREATE INDEX idx_utenti_data_registrazione ON utenti (data_registrazione);
