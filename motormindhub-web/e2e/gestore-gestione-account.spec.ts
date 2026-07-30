import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { requestAccountDeletion, reportUser } from "./helpers/test-amministrazione-utenti";
import { getUserId } from "./helpers/test-users";

test.describe("Gestione Account + Scheda Utente (Gestore Utenti)", () => {
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

  test("lista: ricerca per nome/email e tab di stato filtrano correttamente (RF4.2, UC_22)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const stamp = Date.now();
    const target = await testUsers.create();
    await requestAccountDeletion(target.email, target.password);

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/gestione-account");

    await expect(page.locator("tr", { hasText: target.email })).toBeVisible();

    await page.getByPlaceholder("Cerca utente per nome o email…").fill(`nessuna-corrispondenza-${stamp}`);
    await expect(page.getByRole("heading", { name: "Nessun utente" })).toBeVisible();

    await page.getByPlaceholder("Cerca utente per nome o email…").fill("");
    await page.getByRole("button", { name: "In cancellazione" }).click();
    await expect(page.locator("tr", { hasText: target.email })).toBeVisible();
    await expect(page.locator("tr", { hasText: target.email }).getByText("In cancellazione")).toBeVisible();

    await page.getByRole("button", { name: "Sospesi", exact: true }).click();
    await expect(page.locator("tr", { hasText: target.email })).toHaveCount(0);
  });

  test("scheda utente: sospendi -> riattiva -> esporta, cronologia aggiornata in diretta (RF4.3/4.4/4.7)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto(`/gestore/gestione-account/${targetId}`);

    const statoUtente = page.getByTestId("utente-stato");
    await expect(page.getByRole("heading", { name: "Scheda Utente" })).toBeVisible();
    await expect(statoUtente).toHaveText("ATTIVO");

    // Sospendi (riusa SuspendAccountModal, già verificato in dettaglio in
    // gestore-segnalazioni.spec.ts): qui basta il percorso felice.
    await page.getByRole("button", { name: "Sospendi account" }).click();
    await page.getByRole("button", { name: "Conferma sospensione" }).click();
    await expect(statoUtente).toHaveText("SOSPESO");
    await expect(page.getByText("Sospensione — Sospensione account")).toBeVisible();

    await page.getByRole("button", { name: "Riattiva account" }).click();
    await page.getByRole("button", { name: "Conferma riattivazione" }).click();
    await expect(statoUtente).toHaveText("ATTIVO");
    await expect(page.getByText("Riattivazione — Riattivazione account")).toBeVisible();

    await page.getByRole("button", { name: "Esporta dati utente" }).click();
    await expect(page.getByRole("heading", { name: "Esportazione Inviata" })).toBeVisible();
    await expect(page.getByText(target.email, { exact: false }).first()).toBeVisible();
    await page.getByRole("button", { name: "Torna alla scheda utente" }).click();
    await expect(page.getByText("Esportazione — Esportazione dati assistita")).toBeVisible();
  });

  test("storico segnalazioni: mostra le segnalazioni ricevute dall'utente (RF4.2)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const reporter = await testUsers.create();
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);
    const motivazione = `Motivazione e2e ${Date.now()}`;
    await reportUser(reporter.email, reporter.password, targetId, motivazione);

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto(`/gestore/gestione-account/${targetId}`);

    const segnalazioniRicevute = page.locator("dl > div", { hasText: "Segnalazioni ricevute" });
    await expect(segnalazioniRicevute.getByText("1", { exact: true })).toBeVisible();
    await expect(page.getByText(motivazione)).toBeVisible();
  });

  test("nessun utente: EmptyState invece di una tabella vuota", async ({ page, testUsers }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const stamp = Date.now();

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/gestione-account");
    await page.getByPlaceholder("Cerca utente per nome o email…").fill(`nessuna-corrispondenza-${stamp}`);

    await expect(page.getByRole("heading", { name: "Nessun utente" })).toBeVisible();
  });

  test("responsive: lista e scheda utente restano usabili su viewport mobile", async ({ page, testUsers }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/gestione-account");
    await expect(page.getByRole("heading", { name: "Gestione Account" })).toBeVisible();

    await page.goto(`/gestore/gestione-account/${targetId}`);
    await expect(page.getByRole("heading", { name: "Scheda Utente" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sospendi account" })).toBeVisible();
  });
});
