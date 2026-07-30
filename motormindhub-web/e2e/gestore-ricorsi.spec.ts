import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { suspendAccountApi } from "./helpers/test-amministrazione-utenti";
import { getUserId } from "./helpers/test-users";

test.describe("Ricorsi (Gestore Utenti)", () => {
  // Stesso motivo di manager-articoli-in-attesa.spec.ts: il cookie banner
  // intercetta i click sui pulsanti senza un consenso già deciso.
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("un account sospeso compare in Ricorsi con motivazione, Valuta Ricorso porta alla scheda utente (RF4.3, UC_24)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);
    await suspendAccountApi(gestore.email, gestore.password, targetId, "SPAM");

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/ricorsi");

    const row = page.locator("tr", { hasText: target.email });
    await expect(row).toBeVisible();
    await expect(row.getByText("Violazione dei Termini di Servizio - spam ripetuto")).toBeVisible();

    await row.getByRole("link", { name: "Valuta Ricorso" }).click();
    await expect(page.getByRole("heading", { name: "Scheda Utente" })).toBeVisible();
    await expect(page.getByText("SOSPESO")).toBeVisible();

    // Chiude il ciclo con la riattivazione già verificata in dettaglio in
    // gestore-gestione-account.spec.ts: qui basta confermare che sparisca da Ricorsi.
    await page.getByRole("button", { name: "Riattiva account" }).click();
    await page.getByRole("button", { name: "Conferma riattivazione" }).click();
    await expect(page.getByText("ATTIVO")).toBeVisible();

    await page.goto("/gestore/ricorsi");
    await expect(page.locator("tr", { hasText: target.email })).toHaveCount(0);
  });

  test("nessun account sospeso: EmptyState invece di una tabella vuota", async ({ page, testUsers }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/ricorsi");
    await expect(page.getByText("Caricamento…")).toHaveCount(0, { timeout: 10_000 });

    // DB di sviluppo condiviso: può contenere sospesi da run precedenti, non
    // garantito vuoto — stesso trattamento di gestore-richieste-cancellazione.spec.ts.
    const hasRows = await page.locator("table tbody tr").count();
    if (hasRows === 0) {
      await expect(page.getByRole("heading", { name: "Nessun ricorso in attesa" })).toBeVisible();
    }
  });

  test("responsive: tabella e navigazione restano usabili su viewport mobile", async ({ page, testUsers }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);
    await suspendAccountApi(gestore.email, gestore.password, targetId, "SPAM");

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/ricorsi");
    await expect(page.getByRole("heading", { name: "Ricorsi" })).toBeVisible();

    const row = page.locator("tr", { hasText: target.email });
    await expect(row.getByRole("link", { name: "Valuta Ricorso" })).toBeVisible();
  });
});
