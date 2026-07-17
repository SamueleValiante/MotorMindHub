import { execSync } from "node:child_process";

const API_BASE = "http://localhost:8080";
const MAILPIT_BASE = "http://localhost:8025";
const DB_CONTAINER = "motormindhub-api-db-1";

/**
 * Helper solo per e2e: registra un utente reale (via API pubblica) e lo
 * verifica leggendo il token dall'email catturata da Mailpit (dev SMTP,
 * cfr. application.properties del backend) — non un mock, il flusso di
 * verifica passa dagli endpoint veri.
 */
export async function registerAndVerifyUser(email: string, password: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/utenti/registrazione`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "E2E",
      cognome: "Test",
      email,
      password,
      consensoPrivacy: true,
    }),
  });

  const token = await waitForVerificationToken(email);
  const res = await fetch(`${API_BASE}/api/v1/utenti/verifica-email?token=${token}`);
  if (!res.ok) {
    throw new Error(`Verifica email fallita per ${email}: ${res.status}`);
  }
}

/** Registra un utente senza verificarne l'email (per testare ACCOUNT_NON_VERIFICATO). */
export async function registerUnverified(email: string, password: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/utenti/registrazione`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "E2E",
      cognome: "Test",
      email,
      password,
      consensoPrivacy: true,
    }),
  });
}

async function waitForVerificationToken(email: string, attempts = 20): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(
      `${MAILPIT_BASE}/api/v1/search?query=to:${encodeURIComponent(email)}`
    );
    const data = await res.json();
    const snippet: string | undefined = data.messages?.[0]?.Snippet;
    const match = snippet?.match(/token=([a-f0-9-]+)/);
    if (match) {
      return match[1];
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Nessuna email di verifica trovata per ${email} dopo ${attempts} tentativi`);
}

/**
 * I ruoli AUTORE/MANAGER_AUTORI/GESTORE_UTENTI non sono auto-registrabili
 * (RAD: invito autore, ruolo interno) — per testare il redirect per ruolo
 * si promuove via SQL diretto un account ISCRITTO gia' registrato e
 * verificato, solo nel DB di sviluppo/test.
 */
export function setUserRole(email: string, ruolo: string): void {
  execSync(
    `docker exec ${DB_CONTAINER} psql -U mmh -d motormindhub -c "UPDATE utenti SET ruolo='${ruolo}' WHERE email='${email}';"`
  );
}

export function deleteTestUser(email: string): void {
  execSync(
    `docker exec ${DB_CONTAINER} psql -U mmh -d motormindhub -c "DELETE FROM refresh_tokens WHERE utente_id = (SELECT id FROM utenti WHERE email='${email}'); DELETE FROM utenti WHERE email='${email}';"`
  );
}
