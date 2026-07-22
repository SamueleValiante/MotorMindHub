import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import {
  createDraftArticle,
  createPendingArticle,
  approveArticle,
  rejectArticle,
  deleteDraftArticle,
  deleteArticle,
} from "./helpers/test-articles";

test.describe("I Miei Articoli", () => {
  test("solo una bozza: EmptyState (le bozze non contano su questa pagina)", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const titoloBozza = `Solo bozza ${stamp}`;
    const id = await createDraftArticle(autore.email, autore.password, {
      titolo: titoloBozza,
      categoriaNome: `Categoria solo bozza ${stamp}`,
    });

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore/articoli");

      await expect(page.getByRole("heading", { name: "Nessun articolo ancora" })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloBozza })).not.toBeVisible();
    } finally {
      await deleteDraftArticle(autore.email, autore.password, id);
    }
  });

  test("tab e conteggi: le bozze restano escluse ovunque, Tutti conta solo i 3 stati di questa pagina", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();

    const titoloPubblicato = `Lista pubblicato ${stamp}`;
    const titoloRevisione = `Lista revisione ${stamp}`;
    const titoloRifiutato = `Lista rifiutato ${stamp}`;
    const titoloBozza = `Lista bozza ${stamp}`;

    const idPubblicato = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloPubblicato,
      categoriaNome: `Categoria lista pubblicato ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, idPubblicato);

    const idRevisione = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloRevisione,
      categoriaNome: `Categoria lista revisione ${stamp}`,
    });

    const idRifiutatoSetup = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloRifiutato,
      categoriaNome: `Categoria lista rifiutato ${stamp}`,
    });
    await rejectArticle(manager.email, manager.password, idRifiutatoSetup);

    const idBozza = await createDraftArticle(autore.email, autore.password, {
      titolo: titoloBozza,
      categoriaNome: `Categoria lista bozza ${stamp}`,
    });

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore/articoli");

      await expect(page.getByRole("button", { name: "Tutti (3)" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Pubblicati (1)" })).toBeVisible();
      await expect(page.getByRole("button", { name: "In revisione (1)" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Rifiutati (1)" })).toBeVisible();

      await expect(page.getByRole("heading", { name: titoloBozza })).not.toBeVisible();

      await page.getByRole("button", { name: "Pubblicati (1)" }).click();
      await expect(page.getByRole("heading", { name: titoloPubblicato })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloRevisione })).not.toBeVisible();

      await page.getByRole("button", { name: "Rifiutati (1)" }).click();
      await expect(page.getByRole("heading", { name: titoloRifiutato })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloPubblicato })).not.toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idPubblicato);
      await deleteArticle(manager.email, manager.password, idRevisione);
      await deleteArticle(manager.email, manager.password, idRifiutatoSetup);
      await deleteDraftArticle(autore.email, autore.password, idBozza);
    }
  });

  test("ricerca testuale filtra per titolo", async ({ page, testUsers }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const parolaUnica = `Xerofago${stamp}`;
    const titoloTarget = `Guida ${parolaUnica}`;
    const titoloAltro = `Articolo generico ${stamp}`;

    const idTarget = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloTarget,
      categoriaNome: `Categoria ricerca target ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, idTarget);
    const idAltro = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloAltro,
      categoriaNome: `Categoria ricerca altro ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, idAltro);

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore/articoli");

      await page.getByLabel("Cerca tra i tuoi articoli").fill(parolaUnica);
      await expect(page.getByRole("heading", { name: titoloTarget })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloAltro })).not.toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idTarget);
      await deleteArticle(manager.email, manager.password, idAltro);
    }
  });

  test("azioni per riga: pubblicato e rifiutato hanno modifica/elimina (Editor punto 8), in revisione ha solo elimina", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titoloPubblicato = `Azioni pubblicato ${stamp}`;
    const titoloRevisione = `Azioni revisione ${stamp}`;
    const titoloRifiutato = `Azioni rifiutato ${stamp}`;

    const idPubblicato = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloPubblicato,
      categoriaNome: `Categoria azioni pubblicato ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, idPubblicato);
    const idRevisione = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloRevisione,
      categoriaNome: `Categoria azioni revisione ${stamp}`,
    });
    const idRifiutato = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloRifiutato,
      categoriaNome: `Categoria azioni rifiutato ${stamp}`,
    });
    await rejectArticle(manager.email, manager.password, idRifiutato);

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore/articoli");

      const cardPubblicato = page.locator("div.relative", {
        has: page.getByRole("heading", { name: titoloPubblicato }),
      });
      await expect(cardPubblicato.getByRole("link", { name: "Modifica articolo" })).toHaveAttribute(
        "href",
        `/autore/articoli/${idPubblicato}/modifica`
      );
      await expect(cardPubblicato.getByRole("button", { name: "Elimina articolo" })).toBeVisible();

      const cardRifiutato = page.locator("div.relative", {
        has: page.getByRole("heading", { name: titoloRifiutato }),
      });
      await expect(cardRifiutato.getByRole("link", { name: "Modifica articolo" })).toHaveAttribute(
        "href",
        `/autore/articoli/${idRifiutato}/modifica`
      );
      await expect(cardRifiutato.getByRole("button", { name: "Elimina articolo" })).toBeVisible();

      // In revisione: nessun endpoint di modifica per quello stato (solo
      // deleteArticle, ora estesa a qualunque stato diverso da BOZZA), e
      // nessun link pubblico (non ancora approvato).
      const cardRevisione = page.locator("div.relative", {
        has: page.getByRole("heading", { name: titoloRevisione }),
      });
      await expect(cardRevisione.getByRole("link", { name: "Modifica articolo" })).toHaveCount(0);
      await expect(cardRevisione.getByRole("button", { name: "Elimina articolo" })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(titoloRevisione) })).toHaveCount(0);
    } finally {
      await deleteArticle(manager.email, manager.password, idPubblicato);
      await deleteArticle(manager.email, manager.password, idRifiutato);
      await deleteArticle(manager.email, manager.password, idRevisione);
    }
  });

  test("elimina un pubblicato: conferma nel popup, sparisce dalla lista, annulla non elimina nulla", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Da eliminare ${stamp}`;

    const id = await createPendingArticle(autore.email, autore.password, {
      titolo,
      categoriaNome: `Categoria da eliminare ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, id);

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore/articoli");
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      // Annulla: la riga resta.
      await page.getByRole("button", { name: "Elimina articolo" }).click();
      await expect(page.getByRole("heading", { name: "Eliminare questo articolo?" })).toBeVisible();
      await expect(page.getByText(`"${titolo}"`)).toBeVisible();
      await page.getByRole("button", { name: "Annulla" }).click();
      await expect(page.getByRole("heading", { name: "Eliminare questo articolo?" })).not.toBeVisible();
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      // Conferma: sparisce davvero.
      await page.getByRole("button", { name: "Elimina articolo" }).click();
      await page.getByRole("button", { name: "Sì, rimuovi" }).click();
      await expect(page.getByText("Articolo eliminato con successo.")).toBeVisible();
      await expect(page.getByRole("heading", { name: titolo })).not.toBeVisible();
      await expect(page.getByRole("heading", { name: "Nessun articolo ancora" })).toBeVisible();
    } finally {
      // Già eliminato dal test: nessun cleanup necessario, deleteArticle
      // fallirebbe silenziosamente (non bloccante) se già rimosso.
    }
  });

  test("responsive: filtri, tab e azioni restano usabili su viewport mobile", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const titolo = `Mobile articoli ${stamp}`;
    const id = await createPendingArticle(autore.email, autore.password, {
      titolo,
      categoriaNome: `Categoria mobile articoli ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, id);

    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore/articoli");

      await expect(page.getByRole("heading", { name: "I Miei Articoli" })).toBeVisible();
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      await expect(page.getByRole("button", { name: "Elimina articolo" })).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });
});
