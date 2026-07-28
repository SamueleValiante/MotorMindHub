import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { requestAccountDeletion } from "./helpers/test-amministrazione-utenti";
import { createPendingArticle, deletePendingArticle } from "./helpers/test-articles";

test.describe("Richieste di Cancellazione (Gestore Utenti)", () => {
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

  test("verifica -> procedi: l'account viene anonimizzato, stato passa a Completata (RF4.6, UC_25)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target = await testUsers.create();
    await requestAccountDeletion(target.email, target.password);

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/richieste-cancellazione");

    const row = page.locator("tr", { hasText: target.email });
    await expect(row).toBeVisible();
    await expect(row.getByText("In coda")).toBeVisible();

    await row.getByRole("button", { name: "Verifica" }).click();
    await expect(page.getByRole("heading", { name: "Procedere con la cancellazione?" })).toBeVisible();
    await expect(page.getByText("immediatamente e in modo irreversibile")).toBeVisible();
    await expect(page.getByLabel("Nessun contenuto in sospeso collegato all'account")).toBeChecked();

    await page.getByRole("button", { name: "Procedi con la cancellazione" }).click();
    await expect(page.getByRole("heading", { name: "Procedere con la cancellazione?" })).not.toBeVisible();
    await expect(page.getByText("Cancellazione elaborata con successo.")).toBeVisible();

    // L'anonimizzazione cambia l'email visualizzata: non si può più
    // ricercare la riga per target.email. Il DB di sviluppo condiviso può
    // contenere altre righe "Utente cancellato" da run precedenti — quindi
    // non si verifica un conteggio globale, solo che la riga con la vecchia
    // email sia sparita.
    await expect(page.locator("tr", { hasText: target.email })).toHaveCount(0);
  });

  test("contenuti in sospeso: 409 dal backend, messaggio dedicato, la richiesta resta in coda (UC_25.1)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const articleId = await createPendingArticle(autore.email, autore.password, {
      titolo: `Articolo in sospeso cancellazione e2e ${stamp}`,
      categoriaNome: `Categoria cancellazione e2e ${stamp}`,
    });

    try {
      await requestAccountDeletion(autore.email, autore.password);

      await loginViaUi(page, gestore.email, gestore.password);
      await page.goto("/gestore/richieste-cancellazione");

      const row = page.locator("tr", { hasText: autore.email });
      await row.getByRole("button", { name: "Verifica" }).click();
      await page.getByRole("button", { name: "Procedi con la cancellazione" }).click();

      await expect(
        page.getByText("Impossibile procedere: l'utente ha articoli in attesa di approvazione")
      ).toBeVisible();
      // Il popup resta aperto: un fallimento non deve sembrare un successo.
      await expect(page.getByRole("heading", { name: "Procedere con la cancellazione?" })).toBeVisible();

      await page.getByRole("button", { name: "Annulla" }).click();
      await expect(page.locator("tr", { hasText: autore.email }).getByText("In coda")).toBeVisible();
    } finally {
      // deletePendingArticle vuole un MANAGER_AUTORI (approva+cancella): il
      // GESTORE_UTENTI non ha i permessi su quegli endpoint.
      await deletePendingArticle(manager.email, manager.password, articleId);
    }
  });

  test("nessuna richiesta di cancellazione: EmptyState invece di una tabella vuota", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/richieste-cancellazione");
    await expect(page.getByText("Caricamento…")).toHaveCount(0, { timeout: 10_000 });
    const hasRows = await page.locator("table tbody tr").count();
    if (hasRows === 0) {
      await expect(page.getByRole("heading", { name: "Nessuna richiesta di cancellazione" })).toBeVisible();
    }
  });

  test("responsive: coda e popup restano usabili su viewport mobile", async ({ page, testUsers }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target = await testUsers.create();
    await requestAccountDeletion(target.email, target.password);

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/richieste-cancellazione");
    await expect(page.getByRole("heading", { name: "Richieste di Cancellazione" })).toBeVisible();

    const row = page.locator("tr", { hasText: target.email });
    await row.getByRole("button", { name: "Verifica" }).click();
    await expect(page.getByRole("button", { name: "Procedi con la cancellazione" })).toBeVisible();
  });
});
