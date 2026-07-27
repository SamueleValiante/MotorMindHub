import { execSync } from "node:child_process";

const DB_CONTAINER = "motormindhub-api-db-1";

/**
 * Rete di sicurezza, non il meccanismo primario di cleanup (quello è la
 * fixture createTestUser in fixtures.ts, per-test e mirata): gira una sola
 * volta dopo l'intera suite e ripulisce qualunque utente "e2e-*" rimasto
 * indietro — un worker crashato a metà test salterebbe il cleanup della
 * fixture, ma non questo sweep.
 */
export default async function globalTeardown(): Promise<void> {
  try {
    execSync(
      `docker exec ${DB_CONTAINER} psql -U mmh -d motormindhub -c "` +
        `DELETE FROM refresh_tokens WHERE utente_id IN (SELECT id FROM utenti WHERE email LIKE 'e2e-%'); ` +
        `DELETE FROM token_recupero_password WHERE utente_id IN (SELECT id FROM utenti WHERE email LIKE 'e2e-%'); ` +
        `DELETE FROM richieste_cancellazione WHERE utente_id IN (SELECT id FROM utenti WHERE email LIKE 'e2e-%'); ` +
        `DELETE FROM segnalazioni WHERE segnalante_id IN (SELECT id FROM utenti WHERE email LIKE 'e2e-%') OR segnalato_id IN (SELECT id FROM utenti WHERE email LIKE 'e2e-%'); ` +
        // GestioneArticoli: articoli_salvati va ripulita sia per gli articoli
        // salvati DA un utente e2e, sia per quelli salvati da altri su un
        // articolo AUTORATO da un utente e2e (altrimenti la successiva DELETE
        // su articoli violerebbe articoli_salvati_articolo_id_fkey).
        `DELETE FROM articoli_salvati WHERE utente_id IN (SELECT id FROM utenti WHERE email LIKE 'e2e-%'); ` +
        `DELETE FROM articoli_salvati WHERE articolo_id IN (SELECT id FROM articoli WHERE autore_id IN (SELECT id FROM utenti WHERE email LIKE 'e2e-%')); ` +
        `DELETE FROM articoli WHERE autore_id IN (SELECT id FROM utenti WHERE email LIKE 'e2e-%'); ` +
        // GestioneAmministrazioneUtenti: un utente e2e target di sospendi/
        // riattiva/cancella/esporta lascia una riga in log_azioni_amministrative
        // che violerebbe altrimenti la DELETE su utenti (utente_target_id).
        `DELETE FROM log_azioni_amministrative WHERE utente_target_id IN (SELECT id FROM utenti WHERE email LIKE 'e2e-%'); ` +
        `DELETE FROM utenti WHERE email LIKE 'e2e-%';"`
    );
  } catch (error) {
    console.warn("Sweep di pulizia e2e (global-teardown) fallito, non bloccante:", error);
  }
}
