import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { reportUser, requestAccountDeletion } from "./helpers/test-amministrazione-utenti";
import { getUserId } from "./helpers/test-users";

test.describe("Dashboard Gestione Utenti (Gestore Utenti)", () => {
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

  test("una nuova segnalazione e una richiesta di cancellazione compaiono nelle anteprime, con link alle code (RF4.1)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const reporter = await testUsers.create();
    const target = await testUsers.create();
    const targetId = getUserId(target.email);
    const stamp = Date.now();
    const motivazione = `Motivazione dashboard e2e ${stamp}`;

    await reportUser(reporter.email, reporter.password, targetId, motivazione);
    await requestAccountDeletion(target.email, target.password);

    // Login diretto: /gestore ha ora una pagina reale (questo test stesso),
    // stessa navigazione soft di MANAGER_AUTORI/AUTORE — nessun workaround.
    await loginViaUi(page, gestore.email, gestore.password);
    await expect(page.getByRole("heading", { name: "Dashboard Gestione Utenti" })).toBeVisible();

    await expect(page.getByText(motivazione)).toBeVisible();

    const gdprSection = page.locator("section", { hasText: "Richieste GDPR in coda" });
    await expect(gdprSection.getByText("Cancellazione", { exact: false })).toBeVisible();

    await page
      .locator("section", { hasText: "Segnalazioni recenti" })
      .getByRole("link", { name: "Vai alla coda →" })
      .click();
    await page.waitForURL("**/gestore/segnalazioni");
    await expect(page.getByText(motivazione)).toBeVisible();

    await page.goBack();
    await page
      .locator("section", { hasText: "Richieste GDPR in coda" })
      .getByRole("link", { name: "Vai alla coda →" })
      .click();
    await page.waitForURL("**/gestore/richieste-cancellazione");
    await expect(page.locator("tr", { hasText: target.email })).toBeVisible();
  });

  test("responsive: statistiche e anteprime restano usabili su viewport mobile", async ({ page, testUsers }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, gestore.email, gestore.password);

    await expect(page.getByRole("heading", { name: "Dashboard Gestione Utenti" })).toBeVisible();
    await expect(page.getByText("Utenti registrati")).toBeVisible();
    await expect(page.getByText("Account sospesi")).toBeVisible();
  });
});
