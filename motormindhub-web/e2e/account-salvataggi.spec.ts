import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import {
  createPublishedArticle,
  deleteArticle,
  saveArticleForUser,
  removeSavedArticle,
  getSavedListTypes,
} from "./helpers/test-articles";

test.describe("Account → I Miei Salvataggi", () => {
  test("nessun salvataggio: EmptyState con link a Esplora, non una schermata bianca", async ({
    page,
    testUsers,
  }) => {
    const user = await testUsers.create();
    await loginViaUi(page, user.email, user.password);

    await page.goto("/account/salvataggi");
    await expect(page.getByRole("heading", { name: "Nessun salvataggio ancora" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Esplora articoli" })).toHaveAttribute(
      "href",
      "/esplora"
    );
  });

  test("tab Tutti/Preferiti/Leggi più tardi: conteggi corretti, un articolo in entrambe le liste compare due volte", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const reader = await testUsers.create();
    const stamp = Date.now();

    const titoloA = `Salvataggio A ${stamp}`;
    const titoloB = `Salvataggio B ${stamp}`;
    const titoloC = `Salvataggio C entrambe ${stamp}`;

    const idA = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloA,
      categoriaNome: `Categoria salvataggi A ${stamp}`,
    });
    const idB = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloB,
      categoriaNome: `Categoria salvataggi B ${stamp}`,
    });
    const idC = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloC,
      categoriaNome: `Categoria salvataggi C ${stamp}`,
    });

    // A: solo Preferiti. B: solo Leggi più tardi. C: entrambe (2 righe in "Tutti").
    await saveArticleForUser(reader.email, reader.password, idA, "PREFERITI");
    await saveArticleForUser(reader.email, reader.password, idB, "LEGGI_PIU_TARDI");
    await saveArticleForUser(reader.email, reader.password, idC, "PREFERITI");
    await saveArticleForUser(reader.email, reader.password, idC, "LEGGI_PIU_TARDI");

    try {
      await loginViaUi(page, reader.email, reader.password);
      await page.goto("/account/salvataggi");

      await expect(page.getByRole("button", { name: "Tutti (4)" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Preferiti (2)" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Leggi più tardi (2)" })).toBeVisible();

      // "Tutti": C compare due volte (una riga per ciascun tipoLista).
      await expect(page.getByRole("heading", { name: titoloA })).toHaveCount(1);
      await expect(page.getByRole("heading", { name: titoloC })).toHaveCount(2);

      await page.getByRole("button", { name: "Preferiti (2)" }).click();
      await expect(page.getByRole("heading", { name: titoloA })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloC })).toHaveCount(1);
      await expect(page.getByRole("heading", { name: titoloB })).not.toBeVisible();

      await page.getByRole("button", { name: "Leggi più tardi (2)" }).click();
      await expect(page.getByRole("heading", { name: titoloB })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloC })).toHaveCount(1);
      await expect(page.getByRole("heading", { name: titoloA })).not.toBeVisible();
    } finally {
      await removeSavedArticle(reader.email, reader.password, idA, "PREFERITI");
      await removeSavedArticle(reader.email, reader.password, idB, "LEGGI_PIU_TARDI");
      await removeSavedArticle(reader.email, reader.password, idC, "PREFERITI");
      await removeSavedArticle(reader.email, reader.password, idC, "LEGGI_PIU_TARDI");
      await deleteArticle(manager.email, manager.password, idA);
      await deleteArticle(manager.email, manager.password, idB);
      await deleteArticle(manager.email, manager.password, idC);
    }
  });

  test("rimozione diretta dalla card: sparisce dalla lista, il conteggio scende, verificato via API", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const reader = await testUsers.create();
    const stamp = Date.now();
    const titolo = `Salvataggio da rimuovere ${stamp}`;

    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria rimozione salvataggio ${stamp}`,
    });
    await saveArticleForUser(reader.email, reader.password, id, "PREFERITI");

    try {
      await loginViaUi(page, reader.email, reader.password);
      await page.goto("/account/salvataggi");

      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      await page.getByRole("button", { name: "Rimuovi da Preferiti" }).click();

      await expect(page.getByText("Rimosso dai salvataggi.")).toBeVisible();
      await expect(page.getByRole("heading", { name: titolo })).not.toBeVisible();
      await expect(page.getByRole("heading", { name: "Nessun salvataggio ancora" })).toBeVisible();

      expect(await getSavedListTypes(reader.email, reader.password, id)).toEqual([]);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  test("tab con lista filtrata vuota: messaggio dedicato invece di una lista vuota muta", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const reader = await testUsers.create();
    const stamp = Date.now();
    const titolo = `Solo preferiti ${stamp}`;

    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria solo preferiti ${stamp}`,
    });
    await saveArticleForUser(reader.email, reader.password, id, "PREFERITI");

    try {
      await loginViaUi(page, reader.email, reader.password);
      await page.goto("/account/salvataggi");

      await page.getByRole("button", { name: "Leggi più tardi (0)" }).click();
      await expect(
        page.getByRole("heading", { name: "Nessun articolo in Leggi più tardi" })
      ).toBeVisible();
    } finally {
      await removeSavedArticle(reader.email, reader.password, id, "PREFERITI");
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  test("responsive: tab e lista restano usabili su viewport mobile", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const reader = await testUsers.create();
    const stamp = Date.now();
    const titolo = `Salvataggio mobile ${stamp}`;

    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria salvataggio mobile ${stamp}`,
    });
    await saveArticleForUser(reader.email, reader.password, id, "PREFERITI");

    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await loginViaUi(page, reader.email, reader.password);
      await page.goto("/account/salvataggi");

      await expect(page.getByRole("heading", { name: "I Miei Salvataggi" })).toBeVisible();
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      await expect(page.getByRole("button", { name: "Rimuovi da Preferiti" })).toBeVisible();
    } finally {
      await removeSavedArticle(reader.email, reader.password, id, "PREFERITI");
      await deleteArticle(manager.email, manager.password, id);
    }
  });
});
