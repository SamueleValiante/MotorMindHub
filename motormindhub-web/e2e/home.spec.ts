import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { createPublishedArticle, deleteArticle } from "./helpers/test-articles";

test.describe("Home", () => {
  test("carica articoli e categorie reali dal backend, da anonimo", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const titolo = `Articolo e2e ${Date.now()}`;
    const categoriaNome = `Categoria e2e ${Date.now()}`;
    const articleId = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome,
    });

    try {
      await page.goto("/");

      // Sezione categorie: da getCategoryTree, non hardcoded.
      await expect(page.getByRole("link", { name: categoriaNome, exact: true })).toBeVisible();

      // Sezione "in evidenza": da searchArticles(ordinamento=IN_EVIDENZA), l'articolo appena approvato.
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      await expect(page.getByText(categoriaNome, { exact: true }).first()).toBeVisible();

      // Stat "articoli pubblicati": totaleRisultati reale, non un numero finto.
      await expect(page.getByText("Articoli pubblicati")).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, articleId);
    }
  });

  test("stato anonimo: Accedi/Registrati nell'header, nessuna area riservata", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Accedi" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Registrati" })).toBeVisible();
  });

  test("stato autenticato: chip utente nell'header al posto di Accedi/Registrati", async ({
    page,
    testUsers,
  }) => {
    const user = await testUsers.create();
    await loginViaUi(page, user.email, user.password);

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Accedi" })).not.toBeVisible();
    await expect(page.getByText("E2E T.")).toBeVisible();
  });

  test("i link legali puntano alle rotte previste (pagine non ancora costruite)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();

    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "Termini e Condizioni" })).toHaveAttribute(
      "href",
      "/termini"
    );
    await expect(footer.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute(
      "href",
      "/cookie-policy"
    );
  });
});
