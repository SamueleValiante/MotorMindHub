import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { createPendingArticle, deleteArticle } from "./helpers/test-articles";

test.describe("Dashboard Manageriale", () => {
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

  test("un nuovo articolo in coda compare tra le statistiche e nell'anteprima, con link alla revisione (RF3.1)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const titolo = `Articolo dashboard e2e ${stamp}`;
    const articleId = await createPendingArticle(autore.email, autore.password, {
      titolo,
      categoriaNome: `Categoria dashboard e2e ${stamp}`,
    });

    try {
      await loginViaUi(page, manager.email, manager.password);
      await page.waitForURL("**/manager");

      await expect(page.getByRole("heading", { name: "Dashboard Manageriale" })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(titolo) })).toBeVisible();

      await page.getByRole("link", { name: new RegExp(titolo) }).click();
      await page.waitForURL(`**/manager/articoli-in-attesa/${articleId}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, articleId);
    }
  });

  test("responsive: statistiche e coda in anteprima restano usabili su viewport mobile", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, manager.email, manager.password);

    await expect(page.getByRole("heading", { name: "Dashboard Manageriale" })).toBeVisible();
    await expect(page.getByText("Articoli pubblicati")).toBeVisible();
    await expect(page.getByRole("link", { name: "Vedi tutti →" })).toBeVisible();
  });
});
