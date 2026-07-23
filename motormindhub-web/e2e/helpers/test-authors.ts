const API_BASE = "http://localhost:8080";
const MAILPIT_BASE = "http://localhost:8025";

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data: { accessToken: string } = await res.json();
  return data.accessToken;
}

interface InviteAuthorInput {
  nome: string;
  cognome: string;
  email: string;
  ruolo: "AUTORE" | "MANAGER_AUTORI";
}

/** inviteAuthor (POST /autori/inviti): solo MANAGER_AUTORI. */
export async function inviteAuthorApi(
  managerEmail: string,
  managerPassword: string,
  dto: InviteAuthorInput
): Promise<void> {
  const token = await login(managerEmail, managerPassword);
  await fetch(`${API_BASE}/api/v1/autori/inviti`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(dto),
  });
}

/**
 * L'email di invito (GestioneNotifiche.onAuthorInvited) porta il link
 * completo "/inviti/{token}/accetta", non un "token=" in query string come
 * conferma-email/recupero-password: serve un'estrazione dedicata, non
 * riusabile da waitForEmailToken (helpers/test-users.ts).
 */
export async function waitForInviteToken(email: string, attempts = 20): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const searchRes = await fetch(
      `${MAILPIT_BASE}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`
    );
    const searchData = await searchRes.json();
    const messages: Array<{ ID: string; Subject: string }> = searchData.messages ?? [];
    const match = messages.find((m) => m.Subject.toLowerCase().includes("team editoriale"));

    if (match) {
      const detailRes = await fetch(`${MAILPIT_BASE}/api/v1/message/${match.ID}`);
      const detail: { Text?: string } = await detailRes.json();
      const token = detail.Text?.match(/\/inviti\/([a-f0-9-]+)\/accetta/)?.[1];
      if (token) return token;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Nessuna email di invito trovata per ${email} dopo ${attempts} tentativi`);
}
