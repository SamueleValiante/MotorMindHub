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

  await page.waitForURL("**/account", { timeout: 10000 });

  return decoded;
}
