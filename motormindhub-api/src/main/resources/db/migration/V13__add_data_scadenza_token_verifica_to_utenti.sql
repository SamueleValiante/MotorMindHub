ALTER TABLE utenti
    ADD COLUMN data_scadenza_token_verifica TIMESTAMPTZ;

-- Per gli account gia' NON_VERIFICATO con un token_verifica emesso prima di questa migrazione
-- (che non aveva scadenza), concediamo una finestra di grazia di 24h invece di invalidarlo subito.
UPDATE utenti
SET data_scadenza_token_verifica = now() + INTERVAL '1 day'
WHERE token_verifica IS NOT NULL;
