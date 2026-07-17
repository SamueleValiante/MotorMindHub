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
        `DELETE FROM utenti WHERE email LIKE 'e2e-%';"`
    );
  } catch (error) {
    console.warn("Sweep di pulizia e2e (global-teardown) fallito, non bloccante:", error);
  }
}
