import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { createPendingArticle, approveArticle, deleteArticle } from "./helpers/test-articles";

test.describe("Gestione Autori (Manager)", () => {
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

  test("lista autori: ricerca per nome/email, mostra numero articoli e stato", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });

    await loginViaUi(page, manager.email, manager.password);
    await page.goto("/manager/autori");

    await page.getByLabel("Cerca autore").fill(autore.email);
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(autore.email);
    await expect(rows.first()).toContainText("0"); // nessun articolo
    await expect(rows.first()).toContainText("Attivo");
  });

  test("rimuovi un autore mantenendo gli articoli: retrocesso a ISCRITTO, articolo resta pubblicato (RF3.4, UC_11)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const titolo = `Articolo rimozione mantieni ${stamp}`;
    const articleId = await createPendingArticle(autore.email, autore.password, {
      titolo,
      categoriaNome: `Categoria rimozione mantieni ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, articleId);

    try {
      await loginViaUi(page, manager.email, manager.password);
      await page.goto("/manager/autori");
      await page.getByLabel("Cerca autore").fill(autore.email);
      await page.getByRole("button", { name: /Rimuovi/ }).click();

      await expect(page.getByRole("heading", { name: /Rimuovere/ })).toBeVisible();
      // "Mantieni gli articoli" è il default: non serve toccare i radio.
      await page.getByRole("button", { name: "Conferma rimozione" }).click();
      await expect(page.getByText("Autore rimosso con successo.")).toBeVisible();

      // Non riapre la ricerca: se questo era l'unico autore rimasto (come
      // in questo test isolato), la lista è ora globalmente vuota e
      // AuthorTable mostra l'EmptyState (niente più campo "Cerca autore") —
      // non una tabella filtrata a 0 righe. L'email non deve più comparire
      // in nessuno dei due casi.
      await expect(page.getByText(autore.email)).not.toBeVisible();

      const response = await page.request.get(`http://localhost:8080/api/v1/articoli/${articleId}`);
      const detail: { stato: string; titolo: string } = await response.json();
      expect(response.ok()).toBe(true);
      expect(detail.stato).toBe("PUBBLICATO");
      expect(detail.titolo).toBe(titolo);
    } finally {
      // L'articolo resta deliberatamente ("mantieni"): senza questo cleanup
      // il DELETE FROM utenti della fixture per `autore` fallirebbe con una
      // violazione di articoli_autore_id_fkey (stesso motivo già visto in
      // manager-categorie.spec.ts).
      await deleteArticle(manager.email, manager.password, articleId);
    }
  });

  test("rimuovi un autore eliminando gli articoli: l'articolo non esiste più (RF3.4, UC_11)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const articleId = await createPendingArticle(autore.email, autore.password, {
      titolo: `Articolo rimozione elimina ${stamp}`,
      categoriaNome: `Categoria rimozione elimina ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, articleId);

    await loginViaUi(page, manager.email, manager.password);
    await page.goto("/manager/autori");
    await page.getByLabel("Cerca autore").fill(autore.email);
    await page.getByRole("button", { name: /Rimuovi/ }).click();

    await page.getByText("Elimina gli articoli").click();
    await page.getByRole("button", { name: "Conferma rimozione" }).click();
    await expect(page.getByText("Autore rimosso con successo.")).toBeVisible();

    const response = await page.request.get(`http://localhost:8080/api/v1/articoli/${articleId}`);
    expect(response.status()).toBe(404);
  });

  test("responsive: ricerca, tabella e rimozione restano usabili su viewport mobile", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, manager.email, manager.password);
    await page.goto("/manager/autori");

    await expect(page.getByRole("heading", { name: "Gestione Autori" })).toBeVisible();
    await page.getByLabel("Cerca autore").fill(autore.email);
    await expect(page.locator("table tbody tr")).toHaveCount(1);

    const rimuoviButton = page.getByRole("button", { name: /Rimuovi/ });
    await expect(rimuoviButton).toBeVisible();
    await rimuoviButton.click();
    await expect(page.getByRole("heading", { name: /Rimuovere/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Conferma rimozione" })).toBeVisible();
  });
});
