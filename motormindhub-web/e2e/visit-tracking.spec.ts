import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { loginViaUi } from "./helpers/ui";

/**
 * Legge il numero mostrato da una StatCard tramite la sua etichetta esatta
 * (nessun data-testid nel componente condiviso: stesso pattern "leggero"
 * già usato dal resto della suite, che verifica solo la presenza delle
 * etichette, non i valori numerici).
 */
async function readStatValue(page: Page, label: string): Promise<number> {
  const card = page.getByText(label, { exact: true }).locator("xpath=..");
  const text = await card.locator("p").first().textContent();
  return Number((text ?? "").trim());
}

/** Nuovo contesto browser isolato (nessun cookie ereditato): consenso accettato, home caricata, attesa la POST reale di registrazione visita. Il contesto va chiuso dal chiamante. */
async function generateGuestVisit(browser: import("@playwright/test").Browser): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/visite") && res.request().method() === "POST"
    ),
    (async () => {
      await page.goto("/");
      await page.getByRole("button", { name: "Accetta tutti" }).click();
    })(),
  ]);
  expect(response.status()).toBe(204);
  await context.close();
}

test.describe("Tracciamento visite (RF3.1, UC_28)", () => {
  test("consenso analitici rifiutato: nessuna POST verso /api/v1/visite", async ({ page }) => {
    const visitCalls: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/v1/visite")) {
        visitCalls.push(req.url());
      }
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();
    // Nessuna risposta da attendere (è proprio l'assenza della richiesta il
    // comportamento atteso): un'attesa fissa breve basta a lasciare tempo
    // a un eventuale effect di partire per errore.
    await page.waitForTimeout(800);

    expect(visitCalls).toHaveLength(0);
  });

  test("consenso analitici accettato: una sola POST per bootstrap, con credentials, nessuna duplicazione su navigazione SPA", async ({
    page,
  }) => {
    const visitCalls: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/v1/visite")) {
        visitCalls.push(req.url());
      }
    });

    await page.goto("/");
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/v1/visite") && res.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Accetta tutti" }).click(),
    ]);
    expect(response.status()).toBe(204);
    expect(response.request().headers()["content-length"] ?? "0").toBe("0");

    // Cambio pagina via Link (SPA, nessun reload completo): nessuna nuova POST.
    await page.getByRole("link", { name: "Esplora", exact: true }).click();
    await page.waitForURL("**/esplora");
    await page.waitForTimeout(500);

    expect(visitCalls).toHaveLength(1);

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === "mmh_visit_session");
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
  });

  test("dashboard Gestore Utenti mostra i 5 aggregati reali (oggi/settimana/mese/anno/totale)", async ({
    page,
    browser,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });

    await loginViaUi(page, gestore.email, gestore.password);
    await expect(page.getByRole("heading", { name: "Dashboard Gestione Utenti" })).toBeVisible();
    await expect(page.getByText("Visite al sito")).toBeVisible();

    const before = {
      oggi: await readStatValue(page, "Oggi"),
      totale: await readStatValue(page, "Totale"),
    };

    const NUOVE_VISITE = 3;
    for (let i = 0; i < NUOVE_VISITE; i++) {
      await generateGuestVisit(browser);
    }

    await page.reload();
    await expect(page.getByText("Visite al sito")).toBeVisible();

    const after = {
      oggi: await readStatValue(page, "Oggi"),
      totale: await readStatValue(page, "Totale"),
    };

    expect(after.oggi).toBe(before.oggi + NUOVE_VISITE);
    expect(after.totale).toBe(before.totale + NUOVE_VISITE);
  });
});
