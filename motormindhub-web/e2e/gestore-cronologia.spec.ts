import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { suspendAccountApi, reactivateAccountApi, exportUserDataApi } from "./helpers/test-amministrazione-utenti";
import { getUserId } from "./helpers/test-users";

test.describe("Cronologia Azioni Amministrative (Gestore Utenti)", () => {
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

  test("registra e filtra sospensione/riattivazione/esportazione, il link porta alla scheda utente (RF4.8)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target1 = await testUsers.create();
    const target2 = await testUsers.create();
    const target1Id = getUserId(target1.email);
    const target2Id = getUserId(target2.email);

    await suspendAccountApi(gestore.email, gestore.password, target1Id);
    await reactivateAccountApi(gestore.email, gestore.password, target1Id);
    await exportUserDataApi(gestore.email, gestore.password, target2Id);

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/cronologia");

    await expect(page.getByText("Sospensione — Sospensione account (15 gg)")).toBeVisible();
    await expect(page.getByText("Riattivazione — Riattivazione account")).toBeVisible();
    await expect(page.getByText("Esportazione — Esportazione dati assistita")).toBeVisible();

    await page.getByRole("button", { name: "Sospensioni" }).click();
    await expect(page.getByText("Sospensione — Sospensione account (15 gg)")).toBeVisible();
    await expect(page.getByText("Riattivazione — Riattivazione account")).not.toBeVisible();
    await expect(page.getByText("Esportazione — Esportazione dati assistita")).not.toBeVisible();

    // Tutti gli utenti di test condividono lo stesso nome (fixture "E2E
    // Test", non distinguibile a video): si segue il link dalla riga della
    // sospensione, che è certamente quella di target1.
    await page
      .locator("tr", { hasText: "Sospensione — Sospensione account (15 gg)" })
      .getByRole("link")
      .click();
    await page.waitForURL(`**/gestore/gestione-account/${target1Id}`);
    await expect(page.getByRole("heading", { name: "Scheda Utente" })).toBeVisible();
  });

  test("ricerca testuale filtra per nome utente o dettaglio azione", async ({ page, testUsers }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target = await testUsers.create();
    const targetId = getUserId(target.email);
    const stamp = Date.now();

    await suspendAccountApi(gestore.email, gestore.password, targetId);

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/cronologia");
    await expect(page.getByText("Sospensione — Sospensione account")).toBeVisible();

    await page.getByPlaceholder("Cerca nella cronologia…").fill(`nessuna-corrispondenza-${stamp}`);
    await expect(page.getByRole("heading", { name: "Nessuna azione trovata" })).toBeVisible();
  });

  test("responsive: tabella e tab restano usabili su viewport mobile", async ({ page, testUsers }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target = await testUsers.create();
    const targetId = getUserId(target.email);
    await suspendAccountApi(gestore.email, gestore.password, targetId);

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/cronologia");

    await expect(page.getByRole("heading", { name: "Cronologia Azioni Amministrative" })).toBeVisible();
    await expect(page.getByText("Sospensione — Sospensione account")).toBeVisible();
  });
});
