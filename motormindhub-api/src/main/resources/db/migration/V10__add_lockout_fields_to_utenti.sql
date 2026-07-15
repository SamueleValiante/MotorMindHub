ALTER TABLE utenti
    ADD COLUMN tentativi_falliti INT NOT NULL DEFAULT 0,
    ADD COLUMN bloccato_fino     TIMESTAMPTZ,
    ADD COLUMN token_sblocco     VARCHAR(255);

ALTER TABLE utenti
    ADD CONSTRAINT uq_utenti_token_sblocco UNIQUE (token_sblocco);
