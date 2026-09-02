import { test, expect } from "./fixtures";
import { loginViaUi, pickCategory } from "./helpers/ui";
import { createCategory } from "./helpers/test-articles";

test.describe("Categorie (Autore)", () => {
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

  test("crea una nuova categoria radice: compare nell'albero come nodo di primo livello", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const nome = `Categoria e2e autore ${stamp}`;

    await loginViaUi(page, autore.email, autore.password);
    await page.goto("/autore/categorie");

    await page.getByRole("button", { name: "+ Nuova categoria" }).click();
    await expect(page.getByRole("heading", { name: "Nuova categoria" })).toBeVisible();
    await page.getByLabel("Nome categoria").fill(nome);
    await page.getByLabel("Descrizione").fill("Creata dal test e2e.");
    await page.getByRole("button", { name: "Salva categoria" }).click();
    await expect(page.getByText("Categoria creata con successo.")).toBeVisible();

    await page.getByLabel("Cerca categoria").fill(nome);
    const nodo = page.getByRole("treeitem").filter({ hasText: nome });
    await expect(nodo).toHaveCount(1);
    await expect(nodo).toHaveAttribute("aria-level", "1");
  });

  test("crea una sottocategoria: il drill-down 'Categoria padre' mostra la gerarchia, la ricerca rivela il nodo annidato sotto il padre auto-espanso", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const padreNome = `Categoria e2e padre ${stamp}`;
    const figliaNome = `Categoria e2e figlia ${stamp}`;
    await createCategory(autore.email, autore.password, padreNome);

    await loginViaUi(page, autore.email, autore.password);
    await page.goto("/autore/categorie");

    await page.getByRole("button", { name: "+ Nuova categoria" }).click();
    await page.getByLabel("Nome categoria").fill(figliaNome);
    await pickCategory(page, "Categoria padre", padreNome);
    await page.getByRole("button", { name: "Salva categoria" }).click();
    await expect(page.getByText("Categoria creata con successo.")).toBeVisible();

    // La ricerca sulla sola figlia deve comunque rivelare il padre (pruneToMatches
    // tiene la catena di antenati e la auto-espande) — verifica sia il nesting
    // (aria-level) sia che il padre sia mostrato in contesto, non solo la figlia.
    await page.getByLabel("Cerca categoria").fill(figliaNome);

    // Nessuna categoria duplicata con questo nome — controllo sul testo del
    // nodo, non sul treeitem: essendo annidata, il treeitem del PADRE
    // "contiene" comunque il testo della figlia (è un suo discendente DOM),
    // quindi filtrare i treeitem per hasText: figliaNome ne troverebbe due
    // (padre e figlia). .last() risolve l'ambiguità in modo non fragile: in
    // ordine di documento un antenato precede sempre i propri discendenti,
    // quindi l'ultimo match è garantito essere il treeitem più annidato
    // (la figlia), mai un antenato.
    await expect(page.getByText(figliaNome, { exact: true })).toHaveCount(1);
    const figlia = page.getByRole("treeitem").filter({ hasText: figliaNome }).last();
    const padre = page.getByRole("treeitem").filter({ hasText: padreNome });
    await expect(figlia).toHaveAttribute("aria-level", "2");
    await expect(padre).toBeVisible();
    await expect(padre).toHaveAttribute("aria-level", "1");
  });

  test("modifica: Nome e Categoria padre sono disabilitati, solo Descrizione è editabile e persiste", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const nome = `Categoria e2e modifica ${stamp}`;
    await createCategory(autore.email, autore.password, nome);

    await loginViaUi(page, autore.email, autore.password);
    await page.goto("/autore/categorie");
    await page.getByLabel("Cerca categoria").fill(nome);
    await page.getByRole("button", { name: `Modifica ${nome}` }).click();

    await expect(page.getByRole("heading", { name: "Modifica categoria" })).toBeVisible();
    await expect(page.getByLabel("Nome categoria")).toBeDisabled();
    await expect(page.getByLabel("Categoria padre")).toBeDisabled();

    await page.getByLabel("Descrizione").fill("Descrizione aggiornata via e2e.");
    await page.getByRole("button", { name: "Aggiorna categoria" }).click();
    await expect(page.getByText("Categoria aggiornata con successo.")).toBeVisible();

    // Riapre il form per verificare che la descrizione sia stata davvero
    // persistita dal backend (GestioneCategorie.updateCategory applica solo
    // questo campo), non solo che il toast di successo sia comparso.
    await page.getByLabel("Cerca categoria").fill(nome);
    await page.getByRole("button", { name: `Modifica ${nome}` }).click();
    await expect(page.getByLabel("Descrizione")).toHaveValue("Descrizione aggiornata via e2e.");
  });

  test("responsive: ricerca, albero e form restano usabili su viewport mobile", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const nome = `Mobile categoria autore ${stamp}`;
    await createCategory(autore.email, autore.password, nome);

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, autore.email, autore.password);
    await page.goto("/autore/categorie");

    await expect(page.getByRole("heading", { name: "Categorie" })).toBeVisible();
    await page.getByLabel("Cerca categoria").fill(nome);
    await expect(page.getByRole("treeitem")).toHaveCount(1);
    await expect(page.getByRole("button", { name: `Modifica ${nome}` })).toBeVisible();

    await page.getByRole("button", { name: `Modifica ${nome}` }).click();
    await expect(page.getByRole("heading", { name: "Modifica categoria" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Aggiorna categoria" })).toBeVisible();
  });
});
