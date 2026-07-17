import { execSync } from "node:child_process";

const API_BASE = "http://localhost:8080";
const MAILPIT_BASE = "http://localhost:8025";
const DB_CONTAINER = "motormindhub-api-db-1";

/** Registra un utente senza verificarne l'email (per testare ACCOUNT_NON_VERIFICATO / il flusso di conferma). */
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

/**
 * Registra un utente e restituisce il token di verifica letto dall'email
 * catturata da Mailpit (dev SMTP, cfr. application.properties del backend)
 * — senza consumarlo: serve ai test che vogliono esercitare loro stessi il
 * consumo del token (es. la pagina /conferma-email, o il caso "già usato").
 */
export async function registerAndGetVerificationToken(
  email: string,
  password: string
): Promise<string> {
  await registerUnverified(email, password);
  return waitForEmailToken(email, "Conferma");
}

/**
 * Helper solo per e2e: registra un utente reale (via API pubblica) e lo
 * verifica leggendo il token dall'email catturata da Mailpit — non un
 * mock, il flusso di verifica passa dagli endpoint veri.
 */
export async function registerAndVerifyUser(email: string, password: string): Promise<void> {
  const token = await registerAndGetVerificationToken(email, password);
  const res = await fetch(`${API_BASE}/api/v1/utenti/verifica-email?token=${token}`);
  if (!res.ok) {
    throw new Error(`Verifica email fallita per ${email}: ${res.status}`);
  }
}

/**
 * Richiede il recupero password per un utente già attivo e restituisce il
 * token letto dall'email "Recupero password" catturata da Mailpit, senza
 * consumarlo.
 */
export async function requestPasswordResetAndGetToken(email: string): Promise<string> {
  await fetch(`${API_BASE}/api/v1/utenti/password/recupero`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return waitForEmailToken(email, "Recupero password");
}

/**
 * Cerca tra le email inviate a `email` quella il cui Subject contiene
 * `subjectContains` e ne estrae il token dal corpo completo del messaggio
 * (non dal campo Snippet della ricerca: Mailpit lo tronca a una lunghezza
 * fissa, e un token UUID può finire tagliato a metà — visto succedere
 * durante la verifica manuale del link di recupero password).
 */
async function waitForEmailToken(
  email: string,
  subjectContains: string,
  attempts = 20
): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const searchRes = await fetch(
      `${MAILPIT_BASE}/api/v1/search?query=to:${encodeURIComponent(email)}`
    );
    const searchData = await searchRes.json();
    const messages: Array<{ ID: string; Subject: string }> = searchData.messages ?? [];
    const match = messages.find((m) => m.Subject.includes(subjectContains));

    if (match) {
      const detailRes = await fetch(`${MAILPIT_BASE}/api/v1/message/${match.ID}`);
      const detail: { Text?: string } = await detailRes.json();
      const token = detail.Text?.match(/token=([a-f0-9-]+)/)?.[1];
      if (token) {
        return token;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(
    `Nessuna email con oggetto contenente "${subjectContains}" trovata per ${email} dopo ${attempts} tentativi`
  );
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
    `docker exec ${DB_CONTAINER} psql -U mmh -d motormindhub -c "DELETE FROM refresh_tokens WHERE utente_id = (SELECT id FROM utenti WHERE email='${email}'); DELETE FROM token_recupero_password WHERE utente_id = (SELECT id FROM utenti WHERE email='${email}'); DELETE FROM utenti WHERE email='${email}';"`
  );
}
