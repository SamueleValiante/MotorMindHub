import { test, expect } from "./fixtures";
import { createPublishedArticle, deleteArticle, viewArticle, getCategoryId } from "./helpers/test-articles";

test.describe("Esplora Articoli", () => {
  test("il filtro categoria invia un solo id esatto (nessuna espansione lato client)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaA = `Categoria A ${stamp}`;
    const categoriaB = `Categoria B ${stamp}`;
    const titoloA = `Articolo categoria A ${stamp}`;
    const titoloB = `Articolo categoria B ${stamp}`;

    const idA = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloA,
      categoriaNome: categoriaA,
    });
    const idB = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloB,
      categoriaNome: categoriaB,
    });

    const categoriaAId = await getCategoryId(categoriaA);

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      const [request] = await Promise.all([
        page.waitForRequest(
          (req) => req.url().includes("/api/v1/articoli?") && req.url().includes("categoriaIds")
        ),
        page.getByLabel("Categoria").selectOption({ label: categoriaA }),
        page.getByRole("button", { name: "Applica filtri" }).click(),
      ]);

      // Un solo id nella query string, ed e' esattamente quello di "Categoria A"
      // assegnato dal backend: nessuna espansione/aggiunta di altri id lato client.
      const url = new URL(request.url());
      expect(url.searchParams.getAll("categoriaIds")).toEqual([String(categoriaAId)]);

      await expect(page.getByRole("heading", { name: titoloA })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloB })).not.toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idA);
      await deleteArticle(manager.email, manager.password, idB);
    }
  });

  test("ricerca testuale: solo l'articolo che corrisponde alla query", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const parolaUnica = `Xyloflange${stamp}`;
    const titoloTarget = `Guida ${parolaUnica}`;
    const titoloAltro = `Articolo generico ${stamp}`;
    const categoria = `Categoria ricerca ${stamp}`;

    const idTarget = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloTarget,
      categoriaNome: categoria,
    });
    const idAltro = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloAltro,
      categoriaNome: `${categoria} 2`,
    });

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      await page.getByLabel("Ricerca testuale").fill(parolaUnica);
      await page.getByRole("button", { name: "Applica filtri" }).click();

      await expect(page.getByRole("heading", { name: titoloTarget })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloAltro })).not.toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idTarget);
      await deleteArticle(manager.email, manager.password, idAltro);
    }
  });

  test("ordinamento 'Più lette': l'articolo con più visualizzazioni compare per primo", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoria = `Categoria ordinamento ${stamp}`;
    const titoloPocoLetto = `Poco letto ${stamp}`;
    const titoloMoltoLetto = `Molto letto ${stamp}`;

    const idPocoLetto = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloPocoLetto,
      categoriaNome: categoria,
    });
    const idMoltoLetto = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloMoltoLetto,
      categoriaNome: `${categoria} 2`,
    });
    await viewArticle(idMoltoLetto, 5);

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();
      await page.getByLabel("Ricerca testuale").fill(String(stamp));
      await page.getByRole("button", { name: "Applica filtri" }).click();
      await page.getByRole("button", { name: "Più lette" }).click();

      const titoli = page.getByRole("heading", { level: 3 });
      await expect(titoli.first()).toHaveText(titoloMoltoLetto);
    } finally {
      await deleteArticle(manager.email, manager.password, idPocoLetto);
      await deleteArticle(manager.email, manager.password, idMoltoLetto);
    }
  });

  test("paginazione: più di una pagina di risultati, la pagina 2 mostra altri articoli", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoria = `Categoria paginazione ${stamp}`;
    const ids: number[] = [];

    for (let i = 0; i < 7; i++) {
      const id = await createPublishedArticle(manager.email, manager.password, {
        titolo: `Articolo paginato ${stamp} #${i}`,
        categoriaNome: i === 0 ? categoria : `${categoria} ${i}`,
      });
      ids.push(id);
    }

    try {
      await page.goto(`/esplora?query=${stamp}`);
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      await expect(page.getByText("7 risultati")).toBeVisible();
      await expect(page.getByRole("button", { name: "2", exact: true })).toBeVisible();

      const primoTitoloPagina1 = await page.getByRole("heading", { level: 3 }).first().textContent();

      await page.getByRole("button", { name: "2", exact: true }).click();
      await expect(page).toHaveURL(/pagina=1/);

      // Attesa con retry (non una lettura una tantum subito dopo il click):
      // la fetch della pagina 2 e' asincrona, un textContent() immediato
      // rischia di leggere ancora il risultato della pagina 1.
      await expect(page.getByRole("heading", { level: 3 }).first()).not.toHaveText(
        primoTitoloPagina1 ?? ""
      );
    } finally {
      for (const id of ids) {
        await deleteArticle(manager.email, manager.password, id);
      }
    }
  });

  test("cambiare filtro mentre si è su una pagina >0 resetta a pagina 0", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaTarget = `Categoria reset ${stamp}`;
    const ids: number[] = [];

    // 6 articoli "filler" (stessa query, categorie diverse): riempiono la pagina 1.
    for (let i = 0; i < 6; i++) {
      const id = await createPublishedArticle(manager.email, manager.password, {
        titolo: `Filler reset ${stamp} #${i}`,
        categoriaNome: `Categoria reset filler ${stamp} ${i}`,
      });
      ids.push(id);
    }
    // 2 articoli target, stessa categoria tra loro: nel risultato NON filtrato
    // finiscono in pagina 2 (7°/8° su dimensionePagina=6); nel risultato
    // filtrato per categoriaTarget sono gli UNICI 2 risultati, quindi
    // esistono solo in pagina 1 di quel risultato filtrato.
    const titoloTarget1 = `Target reset ${stamp} A`;
    const titoloTarget2 = `Target reset ${stamp} B`;
    const idTarget1 = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloTarget1,
      categoriaNome: categoriaTarget,
    });
    ids.push(idTarget1);
    const idTarget2 = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloTarget2,
      categoriaNome: categoriaTarget,
    });
    ids.push(idTarget2);

    try {
      await page.goto(`/esplora?query=${stamp}`);
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();
      await expect(page.getByText("8 risultati")).toBeVisible();

      await page.getByRole("button", { name: "2", exact: true }).click();
      await expect(page).toHaveURL(/pagina=1/);

      await page.getByLabel("Categoria").selectOption({ label: categoriaTarget });
      await page.getByRole("button", { name: "Applica filtri" }).click();

      // Se il reset non scattasse, la fetch richiederebbe la pagina 2 di un
      // risultato filtrato che ne ha solo 1 (2 elementi < dimensionePagina):
      // Spring restituirebbe una pagina vuota e l'utente vedrebbe "Nessun
      // risultato" nonostante i 2 articoli esistano davvero.
      await expect(page).not.toHaveURL(/pagina=1/);
      await expect(page.getByRole("heading", { name: titoloTarget1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloTarget2 })).toBeVisible();
    } finally {
      for (const id of ids) {
        await deleteArticle(manager.email, manager.password, id);
      }
    }
  });

  test("categoria + ricerca testuale insieme: vera intersezione, non solo l'ultimo filtro applicato", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaComune = `Categoria combinata ${stamp}`;
    const categoriaAltra = `Categoria combinata altra ${stamp}`;
    const parolaChiave = `Interfrenocombinato${stamp}`;

    const titoloMatch = `${parolaChiave} guida completa`;
    const titoloSoloCategoria = `Altro articolo stessa categoria ${stamp}`;
    const titoloSoloQuery = `${parolaChiave} in altra categoria`;

    // Combacia con entrambi i filtri.
    const idMatch = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloMatch,
      categoriaNome: categoriaComune,
    });
    // Stessa categoria del match, ma la parola chiave non compare nel titolo/testo.
    const idSoloCategoria = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloSoloCategoria,
      categoriaNome: categoriaComune,
    });
    // Contiene la parola chiave, ma e' in un'altra categoria.
    const idSoloQuery = await createPublishedArticle(manager.email, manager.password, {
      titolo: titoloSoloQuery,
      categoriaNome: categoriaAltra,
    });

    try {
      await page.goto("/esplora");
      await page.getByRole("button", { name: "Rifiuta tutti" }).click();

      await page.getByLabel("Ricerca testuale").fill(parolaChiave);
      await page.getByLabel("Categoria").selectOption({ label: categoriaComune });
      await page.getByRole("button", { name: "Applica filtri" }).click();

      await expect(page.getByRole("heading", { name: titoloMatch })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloSoloCategoria })).not.toBeVisible();
      await expect(page.getByRole("heading", { name: titoloSoloQuery })).not.toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, idMatch);
      await deleteArticle(manager.email, manager.password, idSoloCategoria);
      await deleteArticle(manager.email, manager.password, idSoloQuery);
    }
  });

  test("stato vuoto: nessun risultato mostra EmptyState, non una schermata bianca", async ({ page }) => {
    await page.goto("/esplora?query=nessuna-corrispondenza-possibile-xyz");
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();

    await expect(page.getByRole("heading", { name: "Nessun risultato" })).toBeVisible();
  });

  test("responsive: il pannello filtri e i risultati restano usabili su viewport mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/esplora");
    await page.getByRole("button", { name: "Rifiuta tutti" }).click();

    await expect(page.getByRole("heading", { name: "Esplora articoli" })).toBeVisible();
    await expect(page.getByLabel("Categoria")).toBeVisible();
    await expect(page.getByRole("button", { name: "Applica filtri" })).toBeVisible();
  });
});
