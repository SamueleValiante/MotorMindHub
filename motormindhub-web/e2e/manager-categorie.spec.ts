import { test, expect } from "./fixtures";
import { loginViaUi, pickCategory } from "./helpers/ui";
import {
  createCategory,
  createSubcategory,
  createPublishedArticle,
  deleteArticle,
} from "./helpers/test-articles";

test.describe("Gestione Categorie (Manager)", () => {
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

  test("elimina con riassegnazione: gli articoli della categoria eliminata passano alla categoria di destinazione (RF3.5, UC_13)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const origineNome = `Categoria e2e origine ${stamp}`;
    const destinazioneNome = `Categoria e2e destinazione ${stamp}`;
    await createCategory(manager.email, manager.password, origineNome);
    await createCategory(manager.email, manager.password, destinazioneNome);
    const articleId = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Articolo e2e riassegnazione ${stamp}`,
      categoriaNome: origineNome,
    });

    try {
      await loginViaUi(page, manager.email, manager.password);
      await page.goto("/manager/categorie");
      await page.getByLabel("Cerca categoria").fill(origineNome);
      await page.getByRole("button", { name: `Elimina ${origineNome}` }).click();

      await expect(page.getByRole("heading", { name: `Elimina "${origineNome}"` })).toBeVisible();
      await pickCategory(page, "Riassegna articoli a", destinazioneNome);
      await page.getByRole("button", { name: "Elimina definitivamente" }).click();
      await expect(page.getByText("Categoria eliminata e articoli riassegnati.")).toBeVisible();

      // Verifica reale sul backend, non solo il toast: getArticleById espone categoriaNome.
      const response = await page.request.get(`http://localhost:8080/api/v1/articoli/${articleId}`);
      const detail: { categoriaNome: string } = await response.json();
      expect(detail.categoriaNome).toBe(destinazioneNome);
    } finally {
      // Senza questo cleanup, l'articolo resterebbe a puntare al manager di
      // questo test e il DELETE FROM utenti della fixture fallirebbe con una
      // violazione di articoli_autore_id_fkey (visto succedere: nessun ON
      // DELETE CASCADE su quella FK, stessa causa già nota per
      // articoli_salvati, cfr. removeSavedArticle).
      await deleteArticle(manager.email, manager.password, articleId);
    }
  });

  /**
   * La regola di dominio (409 se la categoria ha sottocategorie) è già
   * coperta lato backend da
   * GestioneCategorieTest.deleteCategory_lanciaEccezione_quandoLaCategoriaHaSottocategorie
   * — qui si verifica solo la prevenzione lato UI (CategoryTable, prop
   * hasFigli): il cestino è disabilitato con un tooltip esplicativo per
   * chi ha figli, resta invece cliccabile normalmente per una foglia. Il
   * backend rimane comunque l'autorità finale se qualcosa sfuggisse a
   * questa prevenzione (vedi commento in ReassignCategoryModal).
   */
  test("cestino disabilitato con tooltip per una categoria con sottocategorie, invariato per una foglia", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const padreNome = `Categoria e2e padre bloccata ${stamp}`;
    const figliaNome = `Categoria e2e figlia bloccata ${stamp}`;
    const padreId = await createCategory(manager.email, manager.password, padreNome);
    await createSubcategory(manager.email, manager.password, figliaNome, padreId);

    await loginViaUi(page, manager.email, manager.password);
    await page.goto("/manager/categorie");

    await page.getByLabel("Cerca categoria").fill(padreNome);
    const eliminaPadre = page.getByRole("button", { name: `Elimina ${padreNome}` });
    await expect(eliminaPadre).toBeDisabled();
    await expect(eliminaPadre).toHaveAttribute("title", "Contiene sottocategorie, elimina prima quelle");

    await page.getByLabel("Cerca categoria").fill(figliaNome);
    const eliminaFiglia = page.getByRole("button", { name: `Elimina ${figliaNome}` });
    await expect(eliminaFiglia).toBeEnabled();
    await expect(eliminaFiglia).not.toHaveAttribute("title");
  });

  test("responsive: tabella e azioni (inclusa eliminazione) restano usabili su viewport mobile", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const nome = `Mobile categoria manager ${stamp}`;
    await createCategory(manager.email, manager.password, nome);

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, manager.email, manager.password);
    await page.goto("/manager/categorie");

    await expect(page.getByRole("heading", { name: "Gestione Categorie" })).toBeVisible();
    await page.getByLabel("Cerca categoria").fill(nome);
    await expect(page.locator("table tbody tr")).toHaveCount(1);
    await expect(page.getByRole("button", { name: `Modifica ${nome}` })).toBeVisible();

    const eliminaButton = page.getByRole("button", { name: `Elimina ${nome}` });
    await expect(eliminaButton).toBeVisible();
    await expect(eliminaButton).toBeEnabled();
    await eliminaButton.click();
    await expect(page.getByRole("heading", { name: `Elimina "${nome}"` })).toBeVisible();
    await expect(page.getByRole("button", { name: "Elimina definitivamente" })).toBeVisible();
  });
});
