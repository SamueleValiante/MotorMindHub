const API_BASE = "http://localhost:8080";

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data: { accessToken: string } = await res.json();
  return data.accessToken;
}

/**
 * requestAccountDeletion (POST /utenti/me/cancellazione): crea una
 * RichiestaCancellazione reale (stato IN_CODA) per l'utente autenticato —
 * nessuna UI ancora nei test per attivarla, stesso trattamento di
 * test-articles.ts per gli stati non ancora raggiungibili da un flusso UI
 * di setup.
 */
export async function requestAccountDeletion(email: string, password: string): Promise<void> {
  const token = await login(email, password);
  await fetch(`${API_BASE}/api/v1/utenti/me/cancellazione`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * reportUser (POST /utenti/segnalazioni): crea una Segnalazione reale
 * (stato APERTA) verso segnalatoId, autenticato come reporterEmail — serve
 * un utente distinto dal segnalato (il backend rifiuta l'auto-segnalazione).
 */
export async function reportUser(
  reporterEmail: string,
  reporterPassword: string,
  segnalatoId: number,
  motivazione: string
): Promise<void> {
  const token = await login(reporterEmail, reporterPassword);
  await fetch(`${API_BASE}/api/v1/utenti/segnalazioni`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ segnalatoId, motivazione }),
  });
}

/**
 * suspendAccount/reactivateAccount/exportUserDataAssisted (Gestore Utenti):
 * seminano voci reali in log_azioni_amministrative per i test di Cronologia
 * (mockup 48) senza dover passare dalla UI di Scheda Utente ogni volta — già
 * verificata separatamente in gestore-gestione-account.spec.ts.
 */
export async function suspendAccountApi(
  gestoreEmail: string,
  gestorePassword: string,
  userId: number,
  motivazione = "SPAM"
): Promise<void> {
  const token = await login(gestoreEmail, gestorePassword);
  await fetch(`${API_BASE}/api/v1/amministrazione-utenti/utenti/${userId}/sospensione`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ motivazione, noteAggiuntive: null, durataGiorni: 15 }),
  });
}

export async function reactivateAccountApi(
  gestoreEmail: string,
  gestorePassword: string,
  userId: number
): Promise<void> {
  const token = await login(gestoreEmail, gestorePassword);
  await fetch(`${API_BASE}/api/v1/amministrazione-utenti/utenti/${userId}/riattivazione`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function exportUserDataApi(
  gestoreEmail: string,
  gestorePassword: string,
  userId: number
): Promise<void> {
  const token = await login(gestoreEmail, gestorePassword);
  await fetch(`${API_BASE}/api/v1/amministrazione-utenti/utenti/${userId}/esportazione-dati`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * resolveReport (Gestore Utenti) chiamato direttamente, fuori dalla UI:
 * simula la race del fallimento parziale di "Scala a Sospensione" (mockup
 * 45) — la segnalazione viene archiviata da "un'altra parte" (qui: questa
 * chiamata diretta) esattamente nella finestra tra l'apertura del popup di
 * sospensione e la conferma, cosicché la seconda chiamata dell'orchestrazione
 * lato frontend (resolveReport dopo suspendAccount) trovi la segnalazione
 * già non più APERTA/IN_GESTIONE e fallisca — stesso scenario verificato a
 * mano nel browser.
 */
export async function resolveReportApi(
  gestoreEmail: string,
  gestorePassword: string,
  reportId: number,
  nuovoStato: "IN_GESTIONE" | "ARCHIVIATA"
): Promise<void> {
  const token = await login(gestoreEmail, gestorePassword);
  await fetch(`${API_BASE}/api/v1/amministrazione-utenti/segnalazioni/${reportId}/risoluzione`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ nuovoStato }),
  });
}
