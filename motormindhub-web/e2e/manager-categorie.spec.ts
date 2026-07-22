import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
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
      await page.getByLabel("Riassegna articoli a").selectOption({ label: destinazioneNome });
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

  test("elimina bloccata da sottocategorie: mostra l'errore del backend, il modale resta aperto per riprovare", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const padreNome = `Categoria e2e padre bloccata ${stamp}`;
    const figliaNome = `Categoria e2e figlia bloccata ${stamp}`;
    const altraNome = `Categoria e2e altra ${stamp}`;
    const padreId = await createCategory(manager.email, manager.password, padreNome);
    await createSubcategory(manager.email, manager.password, figliaNome, padreId);
    await createCategory(manager.email, manager.password, altraNome);

    await loginViaUi(page, manager.email, manager.password);
    await page.goto("/manager/categorie");
    await page.getByLabel("Cerca categoria").fill(padreNome);
    await page.getByRole("button", { name: `Elimina ${padreNome}` }).click();

    await expect(page.getByRole("heading", { name: `Elimina "${padreNome}"` })).toBeVisible();
    await page.getByLabel("Riassegna articoli a").selectOption({ label: altraNome });
    await page.getByRole("button", { name: "Elimina definitivamente" }).click();

    await expect(
      page.getByText("Impossibile eliminare una categoria che contiene sottocategorie")
    ).toBeVisible();
    // Il modale resta aperto (UC_13.2 style, nessun redirect/chiusura su errore): si può annullare o riprovare.
    await expect(page.getByRole("heading", { name: `Elimina "${padreNome}"` })).toBeVisible();
    await page.getByRole("button", { name: "Annulla" }).click();
    await expect(page.getByRole("heading", { name: `Elimina "${padreNome}"` })).not.toBeVisible();
  });
});
