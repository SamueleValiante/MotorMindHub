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
