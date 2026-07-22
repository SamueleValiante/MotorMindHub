import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import {
  createDraftArticle,
  createPendingArticle,
  createCategory,
  rejectArticle,
  deleteDraftArticle,
  deleteArticle,
} from "./helpers/test-articles";

test.describe("Le Mie Bozze", () => {
  // Stesso motivo di autore-editor.spec.ts: il cookie banner (fixed, in
  // basso) intercetta i click sui pulsanti in fondo alla pagina senza un
  // consenso già deciso.
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("nessuna bozza: EmptyState con link a Nuovo articolo", async ({ page, testUsers }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });

    await loginViaUi(page, autore.email, autore.password);
    await page.goto("/autore/bozze");

    await expect(page.getByRole("heading", { name: "Nessuna bozza" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Nuovo articolo" })).toHaveAttribute(
      "href",
      "/autore/articoli/nuovo"
    );
  });

  test("una bozza: badge, ultima modifica relativa, Riprendi apre l'editor precompilato, Elimina la rimuove via popup", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const titolo = `Bozza candele ${stamp}`;
    const id = await createDraftArticle(autore.email, autore.password, {
      titolo,
      categoriaNome: `Categoria bozza ${stamp}`,
    });

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore/bozze");

      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      await expect(page.getByText("Bozza", { exact: true })).toBeVisible();
      await expect(page.getByText(/Ultima modifica:/)).toBeVisible();

      await page.getByRole("link", { name: "Riprendi" }).click();
      await page.waitForURL(`**/autore/articoli/${id}/modifica`);
      await expect(page.getByLabel("Titolo dell'articolo")).toHaveValue(titolo);

      await page.goto("/autore/bozze");
      await page.getByRole("button", { name: "Elimina bozza" }).click();
      await expect(page.getByRole("heading", { name: "Eliminare questo articolo?" })).toBeVisible();
      await page.getByRole("button", { name: "Sì, rimuovi" }).click();

      await expect(page.getByText("Bozza eliminata con successo.")).toBeVisible();
      await expect(page.getByRole("heading", { name: titolo })).not.toBeVisible();
      await expect(page.getByRole("heading", { name: "Nessuna bozza" })).toBeVisible();
    } finally {
      // Già eliminata dal test: deleteDraft non lancia su un 404, nessun
      // cleanup bloccante necessario (stesso pattern del test analogo in
      // autore-articoli.spec.ts).
      await deleteDraftArticle(autore.email, autore.password, id);
    }
  });

  /**
   * Il test più importante di questa pagina: verifica che il ciclo
   * rifiuta -> correggi -> appare in Le Mie Bozze -> modifica -> reinvia
   * sia coerente attraverso le pagine dei punti 7 (I Miei Articoli), 8
   * (Editor) e 9 (Le Mie Bozze) usate INSIEME, non tre pezzi verificati
   * isolatamente (quello è già coperto da autore-articoli.spec.ts e
   * autore-editor.spec.ts separatamente).
   */
  test("ciclo end-to-end: rifiuta -> correggi -> appare qui -> riprendi -> reinvia (punti 7+8+9)", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titoloOriginale = `Ciclo bozze ${stamp}`;
    const titoloCorretto = `Ciclo bozze ${stamp} (corretto)`;

    await createCategory(autore.email, autore.password, `Categoria ciclo bozze ${stamp}`);
    const id = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloOriginale,
      categoriaNome: `Categoria ciclo bozze articolo ${stamp}`,
    });
    await rejectArticle(manager.email, manager.password, id, "Manca una fonte verificabile per l'affermazione centrale.");

    try {
      await loginViaUi(page, autore.email, autore.password);

      // Punto 7: I Miei Articoli, il rifiutato è raggiungibile da qui.
      await page.goto("/autore/articoli");
      await page.getByRole("button", { name: "Rifiutati (1)" }).click();
      await expect(page.getByRole("heading", { name: titoloOriginale })).toBeVisible();
      await page.getByRole("link", { name: "Modifica articolo" }).click();

      // Punto 8: Editor, pannello RIFIUTATO -> Correggi.
      await page.waitForURL(`**/autore/articoli/${id}/modifica`);
      await expect(page.getByRole("heading", { name: "Articolo rifiutato" })).toBeVisible();
      await page.getByRole("button", { name: "Correggi" }).click();
      await expect(page.getByText("Articolo riportato in bozza: ora puoi correggerlo.")).toBeVisible();
      await expect(page.getByLabel("Titolo dell'articolo")).toHaveValue(titoloOriginale);

      // Punto 9: ora in BOZZA, deve comparire in Le Mie Bozze (non più tra i rifiutati).
      await page.goto("/autore/bozze");
      await expect(page.getByRole("heading", { name: titoloOriginale })).toBeVisible();

      await page.goto("/autore/articoli");
      await expect(page.getByRole("heading", { name: titoloOriginale })).not.toBeVisible();

      // Riprendi da Le Mie Bozze, modifica il titolo, reinvia in approvazione.
      await page.goto("/autore/bozze");
      await page.getByRole("link", { name: "Riprendi" }).click();
      await page.waitForURL(`**/autore/articoli/${id}/modifica`);
      await page.getByLabel("Titolo dell'articolo").fill(titoloCorretto);
      await page.getByRole("button", { name: "Invia in approvazione" }).click();
      await expect(page.getByText("Articolo inviato in approvazione.")).toBeVisible();
      await page.waitForURL("**/autore/articoli");
      await expect(page.getByRole("heading", { name: titoloCorretto })).toBeVisible();

      // Non più in Le Mie Bozze: è ripartito verso l'approvazione, non è rimasto lì.
      await page.goto("/autore/bozze");
      await expect(page.getByRole("heading", { name: titoloCorretto })).not.toBeVisible();
      await expect(page.getByRole("heading", { name: "Nessuna bozza" })).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });
});
