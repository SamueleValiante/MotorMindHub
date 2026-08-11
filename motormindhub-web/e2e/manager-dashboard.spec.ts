import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { createPendingArticle, createPublishedArticle, viewArticle, deleteArticle } from "./helpers/test-articles";

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

  test("Articoli più letti: vista dell'intera piattaforma, ordinata per numeroVisualizzazioni decrescente, con autore", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const secondoAutore = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();

    const titoloPneumatici = `Pneumatici invernali dashboard manager ${stamp}`;
    const titoloAbs = `Problemi frequenti ABS dashboard manager ${stamp}`;
    const titoloAltro = `Articolo secondo autore ${stamp}`;

    const idPneumatici = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloPneumatici,
      categoriaNome: `Categoria manager piu letti pneumatici ${stamp}`,
    });
    await viewArticle(idPneumatici, 7);

    const idAbs = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloAbs,
      categoriaNome: `Categoria manager piu letti abs ${stamp}`,
    });
    await viewArticle(idAbs, 3);

    // Scritto da un secondo autore: verifica che la vista sia dell'intera
    // piattaforma (non filtrata sul Manager che sta guardando) e mostri
    // l'autore reale di ciascun articolo.
    const idAltro = await createPublishedArticle(secondoAutore.email, secondoAutore.password, {
      titolo: titoloAltro,
      categoriaNome: `Categoria manager piu letti altro ${stamp}`,
    });
    await viewArticle(idAltro, 1);

    try {
      await loginViaUi(page, manager.email, manager.password);
      await page.goto("/manager");
      await expect(page.getByRole("heading", { name: "Articoli più letti" })).toBeVisible();

      // Vista dell'intera piattaforma (top 5 globali, non filtrati per
      // autore): possono comparire anche articoli non creati da questo
      // test, quindi la verifica è sull'ORDINE RELATIVO tra i 3 articoli
      // di prova (via il loro testo, non una posizione assoluta nth()),
      // non sul fatto che siano esattamente le prime 3 righe.
      const righe = page
        .locator("h2", { hasText: "Articoli più letti" })
        .locator("xpath=following-sibling::div[1]/a");
      const testi = await righe.allInnerTexts();
      const indice = (titolo: string) => testi.findIndex((t) => t.includes(titolo));

      const iPneumatici = indice(titoloPneumatici);
      const iAbs = indice(titoloAbs);
      const iAltro = indice(titoloAltro);
      expect(iPneumatici, "pneumatici (7 letture) deve comparire in classifica").toBeGreaterThanOrEqual(0);
      expect(iAbs, "ABS (3 letture) deve comparire in classifica").toBeGreaterThanOrEqual(0);
      expect(iAltro, "articolo del secondo autore (1 lettura) deve comparire in classifica").toBeGreaterThanOrEqual(
        0
      );
      expect(iPneumatici).toBeLessThan(iAbs);
      expect(iAbs).toBeLessThan(iAltro);

      await expect(righe.nth(iPneumatici)).toContainText("7 letture");
      await expect(righe.nth(iPneumatici)).toContainText("E2E Test");
      await expect(righe.nth(iAbs)).toContainText("3 letture");
      await expect(righe.nth(iAltro)).toContainText("1 letture");
    } finally {
      await deleteArticle(manager.email, manager.password, idPneumatici);
      await deleteArticle(manager.email, manager.password, idAbs);
      await deleteArticle(secondoAutore.email, secondoAutore.password, idAltro);
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
