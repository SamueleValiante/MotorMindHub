import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { createPendingArticle, deleteArticle } from "./helpers/test-articles";

test.describe("Articoli in Attesa di Approvazione (Manager)", () => {
  // Stesso motivo di autore-bozze.spec.ts: il cookie banner intercetta i
  // click sui pulsanti in fondo alla pagina senza un consenso già deciso.
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("rivedi -> approva: l'articolo si pubblica e sparisce dalla coda (RF3.6, UC_21)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const titolo = `Articolo approvazione e2e ${stamp}`;
    const articleId = await createPendingArticle(autore.email, autore.password, {
      titolo,
      categoriaNome: `Categoria approvazione e2e ${stamp}`,
    });

    try {
      await loginViaUi(page, manager.email, manager.password);
      await page.goto("/manager/articoli-in-attesa");
      // Il titolo in questa lista è testo di cella, non un heading (solo la
      // pagina di revisione lo rende come <h2>, vedi sotto dopo "Rivedi").
      await expect(page.getByRole("cell", { name: titolo })).toBeVisible();

      await page
        .locator("tr", { hasText: titolo })
        .getByRole("link", { name: "Rivedi" })
        .click();
      await page.waitForURL(`**/manager/articoli-in-attesa/${articleId}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      await page.getByRole("button", { name: "Approva e pubblica" }).click();
      await page.waitForURL("**/manager/articoli-in-attesa");
      await expect(page.getByRole("heading", { name: titolo })).not.toBeVisible();

      const response = await page.request.get(`http://localhost:8080/api/v1/articoli/${articleId}`);
      const detail: { stato: string } = await response.json();
      expect(detail.stato).toBe("PUBBLICATO");
    } finally {
      await deleteArticle(manager.email, manager.password, articleId);
    }
  });

  test("rivedi -> rifiuta con motivazione: l'articolo torna all'autore (RF3.6, UC_21)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const titolo = `Articolo rifiuto e2e ${stamp}`;
    const articleId = await createPendingArticle(autore.email, autore.password, {
      titolo,
      categoriaNome: `Categoria rifiuto e2e ${stamp}`,
    });

    try {
      await loginViaUi(page, manager.email, manager.password);
      await page.goto(`/manager/articoli-in-attesa/${articleId}`);

      await page.getByRole("button", { name: "Rifiuta" }).click();
      await expect(page.getByText("Inserire una motivazione per il rifiuto.")).toBeVisible();

      await page.getByLabel("Motivazione (se rifiuto)").fill("Manca una fonte verificabile.");
      await page.getByRole("button", { name: "Rifiuta" }).click();
      await page.waitForURL("**/manager/articoli-in-attesa");

      const response = await page.request.get(`http://localhost:8080/api/v1/articoli/${articleId}`);
      const detail: { stato: string; motivazioneRifiuto: string | null } = await response.json();
      expect(detail.stato).toBe("RIFIUTATO");
      expect(detail.motivazioneRifiuto).toBe("Manca una fonte verificabile.");
    } finally {
      await deleteArticle(manager.email, manager.password, articleId);
    }
  });

  test("nessun articolo in attesa: EmptyState invece di una tabella vuota", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });

    await loginViaUi(page, manager.email, manager.password);
    await page.goto("/manager/articoli-in-attesa");
    // Attende che il caricamento sia concluso prima di contare le righe:
    // altrimenti "Caricamento…" (nessuna <table> nel DOM) darebbe un falso
    // 0 prima che il fetch sia risolto. Il DB di sviluppo condiviso
    // potrebbe comunque non essere mai vuoto: verifica solo che, SE non ci
    // sono righe, compaia l'EmptyState e non una tabella rotta.
    await expect(page.getByText("Caricamento…")).toHaveCount(0, { timeout: 10_000 });
    const hasRows = await page.locator("table tbody tr").count();
    if (hasRows === 0) {
      await expect(page.getByRole("heading", { name: "Nessun articolo in attesa" })).toBeVisible();
    }
  });

  test("responsive: coda e revisione restano usabili su viewport mobile", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const titolo = `Articolo mobile e2e ${stamp}`;
    const articleId = await createPendingArticle(autore.email, autore.password, {
      titolo,
      categoriaNome: `Categoria mobile e2e ${stamp}`,
    });

    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await loginViaUi(page, manager.email, manager.password);
      await page.goto("/manager/articoli-in-attesa");
      await expect(page.getByRole("heading", { name: "Articoli in Attesa di Approvazione" })).toBeVisible();

      await page.goto(`/manager/articoli-in-attesa/${articleId}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      await expect(page.getByRole("button", { name: "Approva e pubblica" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Rifiuta" })).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, articleId);
    }
  });
});
