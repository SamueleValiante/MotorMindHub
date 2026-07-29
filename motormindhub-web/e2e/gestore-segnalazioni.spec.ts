import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { reportUser, resolveReportApi } from "./helpers/test-amministrazione-utenti";
import { getUserId } from "./helpers/test-users";

test.describe("Coda Segnalazioni + Dettaglio (Gestore Utenti)", () => {
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

  test("scala a sospensione: percorso felice, l'account viene sospeso e la segnalazione archiviata (UC_26.2)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const reporter = await testUsers.create();
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);
    const stamp = Date.now();
    const motivazione = `Motivazione scala e2e felice ${stamp}`;

    await reportUser(reporter.email, reporter.password, targetId, motivazione);

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/segnalazioni");

    const row = page.locator("tr", { hasText: motivazione });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Esamina" }).click();
    await page.waitForURL(/\/gestore\/segnalazioni\/\d+/);

    await page.getByRole("button", { name: "Scala a sospensione" }).click();
    await page.getByRole("button", { name: "Conferma sospensione" }).click();

    await expect(page.getByText("Account sospeso e segnalazione archiviata.")).toBeVisible();
    await page.waitForURL("**/gestore/segnalazioni");
    await expect(page.locator("tr", { hasText: motivazione })).toHaveCount(0);

    // Verifica indipendente dello stato reale dell'account (non solo che la
    // segnalazione sia sparita dalla vista "Aperte"): naviga alla Scheda
    // Utente del segnalato e controlla lo stato SOSPESO.
    await page.goto(`/gestore/gestione-account/${targetId}`);
    await expect(page.getByText("SOSPESO")).toBeVisible();
  });

  test("fallimento parziale forzato: segnalazione già archiviata prima del click, messaggio dedicato (UC_26.2)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const reporter = await testUsers.create();
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);
    const stamp = Date.now();
    const motivazione = `Motivazione scala e2e fallimento ${stamp}`;

    await reportUser(reporter.email, reporter.password, targetId, motivazione);

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/segnalazioni");

    const row = page.locator("tr", { hasText: motivazione });
    await row.getByRole("link", { name: "Esamina" }).click();
    await page.waitForURL(/\/gestore\/segnalazioni\/(\d+)/);
    const reportId = Number(page.url().match(/\/gestore\/segnalazioni\/(\d+)/)?.[1]);
    expect(reportId).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Scala a sospensione" }).click();

    // Race forzata: la segnalazione viene archiviata "da qualcun altro"
    // esattamente nella finestra tra apertura del popup e conferma — stesso
    // scenario già verificato a mano nel browser in un turno precedente.
    await resolveReportApi(gestore.email, gestore.password, reportId, "ARCHIVIATA");

    await page.getByRole("button", { name: "Conferma sospensione" }).click();

    await expect(
      page.getByText(
        "Utente sospeso correttamente, ma la segnalazione non è stata chiusa — chiudila manualmente dalla coda."
      )
    ).toBeVisible();
    await page.waitForURL("**/gestore/segnalazioni");

    // suspendAccount è comunque riuscito, nonostante resolveReport sia
    // fallito: verifica indipendente sulla Scheda Utente.
    await page.goto(`/gestore/gestione-account/${targetId}`);
    await expect(page.getByText("SOSPESO")).toBeVisible();
  });

  test("responsive: coda e dettaglio restano usabili su viewport mobile", async ({ page, testUsers }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const reporter = await testUsers.create();
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);
    const stamp = Date.now();
    const motivazione = `Motivazione scala e2e responsive ${stamp}`;

    await reportUser(reporter.email, reporter.password, targetId, motivazione);

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/segnalazioni");
    await expect(page.getByRole("heading", { name: "Coda Segnalazioni" })).toBeVisible();

    const row = page.locator("tr", { hasText: motivazione });
    await row.getByRole("link", { name: "Esamina" }).click();
    await page.waitForURL(/\/gestore\/segnalazioni\/\d+/);
    await expect(page.getByRole("heading", { name: "Dettaglio Segnalazione" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Scala a sospensione" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Archivia come infondata" })).toBeVisible();
  });
});
