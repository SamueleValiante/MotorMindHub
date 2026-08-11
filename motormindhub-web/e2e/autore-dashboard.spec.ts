import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import {
  createDraftArticle,
  createPendingArticle,
  deleteDraftArticle,
  deletePendingArticle,
  deleteArticle,
  approveArticle,
  viewArticle,
  login,
} from "./helpers/test-articles";

test.describe("Dashboard Autore", () => {
  test("le statistiche aggregano su TUTTI gli articoli, anche oltre una eventuale soglia di paginazione", async ({
    page,
    testUsers,
  }) => {
    // getArticlesByAuthor non è Pageable (List<ArticleSummaryDTO> semplice,
    // verificato sul repository: findByAutoreIdOrderByDataUltimoAggiornamentoDesc
    // non ha parametro Pageable) — 22 supera comunque la dimensionePagina di
    // default vista altrove (20 su searchArticles), a riprova diretta anche
    // se il backend cambiasse domani.
    test.setTimeout(120_000);

    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const TOTALE_ARTICOLI = 22;

    // Un login per account, riusato per tutte le 22 iterazioni: un login
    // per iterazione (44 in totale su 2 soli account) esaurirebbe
    // LoginRateLimiter (10/min per account) senza alcun bisogno reale di
    // una sessione nuova ogni volta - la stessa sessione resta valida per
    // tutto il loop.
    const autoreToken = await login(autore.email, autore.password);
    const managerToken = await login(manager.email, manager.password);

    const ids: number[] = [];
    for (let i = 0; i < TOTALE_ARTICOLI; i++) {
      const id = await createPendingArticle(
        autore.email,
        autore.password,
        {
          titolo: `Articolo aggregazione ${stamp} #${i}`,
          categoriaNome: `Categoria aggregazione ${stamp} ${i}`,
        },
        autoreToken
      );
      await approveArticle(manager.email, manager.password, id, managerToken);
      await viewArticle(id, 1);
      ids.push(id);
    }

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore");

      const pubblicatiTile = page.getByText("Articoli pubblicati").locator("..");
      await expect(pubblicatiTile.getByText(String(TOTALE_ARTICOLI), { exact: true })).toBeVisible();

      const lettureTile = page.getByText("Letture totali").locator("..");
      await expect(lettureTile.getByText(String(TOTALE_ARTICOLI), { exact: true })).toBeVisible();
    } finally {
      for (const id of ids) {
        await deleteArticle(manager.email, manager.password, id, managerToken);
      }
    }
  });

  test("nessun articolo: EmptyState con link a Nuovo articolo, non una schermata bianca", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    await loginViaUi(page, autore.email, autore.password);

    await page.goto("/autore");
    await expect(page.getByRole("heading", { name: "Nessun articolo ancora" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Nuovo articolo", exact: true })).toHaveAttribute(
      "href",
      "/autore/articoli/nuovo"
    );
  });

  test("le 4 statistiche riflettono i conteggi reali di getArticlesByAuthor, non numeri finti", async ({
    page,
    testUsers,
  }) => {
    // Un Autore semplice (non anche Manager): la dashboard deve funzionare
    // per lui senza mai chiamare getManagerDashboardStats, riservato a
    // MANAGER_AUTORI (403 altrimenti).
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();

    const titoloPubblicato = `Dashboard pubblicato ${stamp}`;
    const titoloRevisione = `Dashboard in revisione ${stamp}`;
    const titoloBozza = `Dashboard bozza ${stamp}`;

    const idPubblicato = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloPubblicato,
      categoriaNome: `Categoria dashboard pubblicato ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, idPubblicato);
    await viewArticle(idPubblicato, 3);

    const idRevisione = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloRevisione,
      categoriaNome: `Categoria dashboard revisione ${stamp}`,
    });
    const idBozza = await createDraftArticle(autore.email, autore.password, {
      titolo: titoloBozza,
      categoriaNome: `Categoria dashboard bozza ${stamp}`,
    });

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore");

      await expect(page.getByText("Articoli pubblicati")).toBeVisible();
      const pubblicatiTile = page.getByText("Articoli pubblicati").locator("..");
      await expect(pubblicatiTile.getByText("1", { exact: true })).toBeVisible();

      const revisioneTile = page.getByText("In attesa di approvazione").locator("..");
      await expect(revisioneTile.getByText("1", { exact: true })).toBeVisible();

      const bozzeTile = page.getByText("Bozze salvate").locator("..");
      await expect(bozzeTile.getByText("1", { exact: true })).toBeVisible();

      // 3 viste sull'unico pubblicato: la somma reale, non un numero a caso.
      const lettureTile = page.getByText("Letture totali").locator("..");
      await expect(lettureTile.getByText("3", { exact: true })).toBeVisible();

      // I tre articoli compaiono in "I tuoi ultimi articoli" con lo stato corretto.
      await expect(page.getByRole("heading", { name: titoloPubblicato })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloRevisione })).toBeVisible();
      await expect(page.getByRole("heading", { name: titoloBozza })).toBeVisible();
      await expect(page.getByText("Pubblicato", { exact: true })).toBeVisible();
      await expect(page.getByText("In revisione", { exact: true })).toBeVisible();
      await expect(page.getByText("Bozza", { exact: true })).toBeVisible();
    } finally {
      await deletePendingArticle(manager.email, manager.password, idRevisione);
      await deleteDraftArticle(autore.email, autore.password, idBozza);
      await deleteArticle(manager.email, manager.password, idPubblicato);
    }
  });

  test("solo l'articolo pubblicato è cliccabile: bozze e in revisione non linkano al dettaglio pubblico", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();

    const titoloPubblicato = `Cliccabile pubblicato ${stamp}`;
    const titoloBozza = `Non cliccabile bozza ${stamp}`;

    const idPubblicato = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloPubblicato,
      categoriaNome: `Categoria cliccabile ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, idPubblicato);
    const idBozza = await createDraftArticle(autore.email, autore.password, {
      titolo: titoloBozza,
      categoriaNome: `Categoria non cliccabile ${stamp}`,
    });

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore");

      // Scoped a "I tuoi ultimi articoli": da quando esiste anche "I tuoi
      // articoli più letti" (sezione distinta, sotto), un articolo pubblicato
      // può legittimamente comparire come link in ENTRAMBE le sezioni - un
      // conteggio sull'intera pagina non distinguerebbe più "cliccabile" da
      // "linkato due volte per motivi indipendenti".
      const ultimiArticoliSection = page.locator("section", { hasText: "I tuoi ultimi articoli" });
      await expect(ultimiArticoliSection.getByRole("link", { name: new RegExp(titoloPubblicato) })).toHaveCount(1);
      await expect(ultimiArticoliSection.getByRole("link", { name: new RegExp(titoloBozza) })).toHaveCount(0);

      // Non solo "non è un link": una spiegazione visibile del perché, non
      // una card identica alle altre che sembra semplicemente rotta al click.
      await expect(
        page.getByText("Anteprima non disponibile prima della pubblicazione")
      ).toBeVisible();
    } finally {
      await deleteDraftArticle(autore.email, autore.password, idBozza);
      await deleteArticle(manager.email, manager.password, idPubblicato);
    }
  });

  test("Articoli più letti: ordinati per numeroVisualizzazioni decrescente, solo pubblicati", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();

    const titoloPneumatici = `Pneumatici invernali ${stamp}`;
    const titoloAbs = `Problemi frequenti ABS ${stamp}`;
    const titoloBozza = `Bozza mai pubblicata ${stamp}`;

    const idPneumatici = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloPneumatici,
      categoriaNome: `Categoria piu letti pneumatici ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, idPneumatici);
    await viewArticle(idPneumatici, 7);

    const idAbs = await createPendingArticle(autore.email, autore.password, {
      titolo: titoloAbs,
      categoriaNome: `Categoria piu letti abs ${stamp}`,
    });
    await approveArticle(manager.email, manager.password, idAbs);
    await viewArticle(idAbs, 3);

    // Una bozza non pubblicata non deve comparire nella classifica (0
    // letture per definizione, elencarla sarebbe fuorviante).
    const idBozza = await createDraftArticle(autore.email, autore.password, {
      titolo: titoloBozza,
      categoriaNome: `Categoria piu letti bozza ${stamp}`,
    });

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore");
      await expect(page.getByRole("heading", { name: "I tuoi articoli più letti" })).toBeVisible();

      // Solo 2 righe (i due pubblicati): la bozza non compare in classifica.
      const righe = page
        .locator("h2", { hasText: "I tuoi articoli più letti" })
        .locator("xpath=following-sibling::div[1]/a");
      await expect(righe).toHaveCount(2);
      await expect(righe.nth(0)).toContainText(titoloPneumatici);
      await expect(righe.nth(0)).toContainText("7 letture");
      await expect(righe.nth(1)).toContainText(titoloAbs);
      await expect(righe.nth(1)).toContainText("3 letture");
    } finally {
      await deleteDraftArticle(autore.email, autore.password, idBozza);
      await deleteArticle(manager.email, manager.password, idAbs);
      await deleteArticle(manager.email, manager.password, idPneumatici);
    }
  });

  test("responsive: statistiche e ultimi articoli restano usabili su viewport mobile", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const titolo = `Dashboard mobile ${stamp}`;
    const id = await createDraftArticle(autore.email, autore.password, {
      titolo,
      categoriaNome: `Categoria dashboard mobile ${stamp}`,
    });

    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore");

      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
    } finally {
      await deleteDraftArticle(autore.email, autore.password, id);
    }
  });
});
