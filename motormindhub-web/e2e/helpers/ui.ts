import type { Page } from "@playwright/test";

interface DecodedAccessToken {
  uid: number;
  ruolo: string;
}

function decodeAccessTokenPayload(token: string): DecodedAccessToken {
  const payload = token.split(".")[1];
  const json = Buffer.from(payload, "base64url").toString("utf-8");
  return JSON.parse(json);
}

// Rispecchia ROLE_HOME_PATH (lib/auth/roleRedirect.ts): il redirect post-login
// dipende dal ruolo, non è sempre /account (ISCRITTO va alla home pubblica).
const ROLE_HOME_PATH: Record<string, string> = {
  ISCRITTO: "/",
  AUTORE: "/autore",
  MANAGER_AUTORI: "/manager",
  GESTORE_UTENTI: "/gestore",
};

/**
 * Login via UI. Restituisce l'uid decodificato dall'access token (utile ai
 * test che hanno bisogno del proprio id numerico, es. il caso di
 * auto-segnalazione).
 */
export async function loginViaUi(
  page: Page,
  email: string,
  password: string
): Promise<DecodedAccessToken> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").waitFor({ state: "visible" });
  await page.waitForTimeout(300);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/auth/login") && res.request().method() === "POST"
    ),
    page.getByRole("button", { name: "Accedi" }).click(),
  ]);
  const body: { accessToken: string } = await response.json();
  const decoded = decodeAccessTokenPayload(body.accessToken);

  const homePath = ROLE_HOME_PATH[decoded.ruolo] ?? "/account";
  await page.waitForURL(`**${homePath}`, { timeout: 10000 });

  return decoded;
}

/**
 * Sceglie una categoria tramite CategoryPickerField (drill-down + conferma,
 * sostituisce il <select> piatto in editor articolo/CategoryFormModal/
 * ReassignCategoryModal): apre il trigger via label e clicca il nodo con
 * quel nome. Assume che sia visibile al livello radice del drill-down — vero
 * per tutte le categorie create nei test via createCategory/test-articles.ts
 * (nessun categoriaPadreId, quindi sempre nodi radice, sempre foglie): un
 * click sceglie e chiude subito, senza bisogno di navigare più livelli.
 */
export async function pickCategory(page: Page, labelText: string, categoriaNome: string): Promise<void> {
  await page.getByLabel(labelText).click();
  await page
    .getByRole("dialog", { name: "Seleziona categoria" })
    .getByRole("button", { name: categoriaNome, exact: true })
    .click();
}
