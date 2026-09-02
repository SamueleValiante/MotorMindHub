import path from "node:path";
import { test, expect } from "./fixtures";
import { AxeBuilder } from "@axe-core/playwright";
import { loginViaUi, pickCategory } from "./helpers/ui";
import { createCategory, rejectArticle, approveArticle, deleteArticle } from "./helpers/test-articles";

const INLINE_IMAGE_PATH = path.join(__dirname, "fixtures", "inline-image.png");

test.describe("Editor articolo", () => {
  // Il cookie banner (fixed, in basso) e i pulsanti primari dell'editor
  // finiscono nella stessa zona di viewport: senza un consenso già deciso
  // il banner intercetta i click (stesso pattern del bottom-64 di
  // ToastViewport, cfr. toast-cookie-overlap.spec.ts) — qui pre-seminato
  // via cookie invece che cliccato in UI, per non far dipendere ogni test
  // da un'interazione estranea al flusso che sta verificando.
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("ciclo completo: crea bozza, salva, invia in approvazione, rifiuto, correzione, reinvio, approvazione e modifica da pubblicato", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaNome = `Editor E2E ${stamp}`;
    const titoloOriginale = `Guida ciclo editor ${stamp}`;
    const titoloCorretto = `Guida ciclo editor ${stamp} (corretta)`;
    const motivazione = `Titolo non conforme alle linee guida ${stamp}.`;

    await createCategory(autore.email, autore.password, categoriaNome);

    await loginViaUi(page, autore.email, autore.password);
    await page.goto("/autore/articoli/nuovo");
    await expect(page.getByRole("heading", { name: "Nuovo Articolo" })).toBeVisible();

    // Nessun id ancora: Salva bozza deve creare l'articolo e portare l'URL
    // sulla pagina di modifica (createDraft non prende body ma restituisce
    // l'id, cfr. DraftCreatedResponseDTO).
    await page.getByLabel("Titolo dell'articolo").fill(titoloOriginale);
    // .fill() non è affidabile su un'area contenteditable ProseMirror (TipTap):
    // click + pressSequentially digita carattere per carattere, innescando gli
    // eventi beforeinput/input nativi da cui ProseMirror ricostruisce il
    // proprio stato — stesso motivo per cui è usato per tutti i campi
    // "Testo dell'articolo" in questo file.
    await page.getByLabel("Testo dell'articolo").click();
    await page.getByLabel("Testo dell'articolo").pressSequentially("Testo di prova per il ciclo end-to-end dell'editor.");
    await pickCategory(page, "Categoria", categoriaNome);
    await page.getByRole("button", { name: "+ Aggiungi" }).click();
    await page.getByPlaceholder("Nuovo tag…").fill("prova-e2e");
    await page.getByPlaceholder("Nuovo tag…").press("Enter");
    await expect(page.getByText("prova-e2e", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Salva bozza" }).click();
    await expect(page.getByText("Bozza salvata con successo.")).toBeVisible();
    await page.waitForURL(/\/autore\/articoli\/\d+\/modifica$/);
    await expect(page.getByRole("heading", { name: "Modifica Articolo" })).toBeVisible();

    const match = page.url().match(/\/autore\/articoli\/(\d+)\/modifica$/);
    if (!match) throw new Error(`Id non trovato nell'URL: ${page.url()}`);
    const id = Number(match[1]);

    // Ricaricata dalla bozza appena salvata: titolo e tag persistiti.
    await expect(page.getByLabel("Titolo dell'articolo")).toHaveValue(titoloOriginale);
    await expect(page.getByText("prova-e2e", { exact: true })).toBeVisible();

    try {
      await page.getByRole("button", { name: "Invia in approvazione" }).click();
      await expect(page.getByText("Articolo inviato in approvazione.")).toBeVisible();
      await page.waitForURL("**/autore/articoli");
      await expect(page.getByRole("heading", { name: titoloOriginale })).toBeVisible();

      // Rifiuto lato Manager: nessuna coda di revisione costruita ancora
      // (stesso limite già documentato in test-articles.ts), stesso pattern
      // già in uso in autore-articoli.spec.ts per simulare l'altra sessione.
      await rejectArticle(manager.email, manager.password, id, motivazione);

      await page.goto(`/autore/articoli/${id}/modifica`);
      await expect(page.getByRole("heading", { name: "Articolo rifiutato" })).toBeVisible();
      await expect(page.getByText(motivazione)).toBeVisible();
      await expect(page.getByLabel("Titolo dell'articolo")).not.toBeVisible();

      await page.getByRole("button", { name: "Correggi" }).click();
      await expect(page.getByText("Articolo riportato in bozza: ora puoi correggerlo.")).toBeVisible();

      // Stessa pagina, nessuna navigazione: reopenRejectedArticle ha
      // riportato lo stato a BOZZA e l'editor si è ricaricato sul posto.
      await expect(page.getByLabel("Titolo dell'articolo")).toHaveValue(titoloOriginale);
      await expect(page.getByRole("button", { name: "Invia in approvazione" })).toBeVisible();

      await page.getByLabel("Titolo dell'articolo").fill(titoloCorretto);
      await page.getByRole("button", { name: "Invia in approvazione" }).click();
      await expect(page.getByText("Articolo inviato in approvazione.")).toBeVisible();
      await page.waitForURL("**/autore/articoli");
      await expect(page.getByRole("heading", { name: titoloCorretto })).toBeVisible();

      await approveArticle(manager.email, manager.password, id);

      await page.goto(`/autore/articoli/${id}/modifica`);
      await expect(page.getByLabel("Titolo dell'articolo")).toHaveValue(titoloCorretto);
      await expect(page.getByRole("button", { name: "Aggiorna articolo" })).toBeVisible();
      // PUBBLICATO: nessun passaggio per bozza, un solo pulsante diretto.
      await expect(page.getByRole("button", { name: "Salva bozza" })).not.toBeVisible();

      await page.getByLabel("Testo dell'articolo").click();
      // Il documento TipTap parte da "Testo di prova...": seleziona tutto
      // prima di digitare il nuovo testo, altrimenti pressSequentially lo
      // appenderebbe invece di sostituirlo (a differenza di .fill()).
      await page.keyboard.press("ControlOrMeta+A");
      await page.getByLabel("Testo dell'articolo").pressSequentially("Testo aggiornato dopo la pubblicazione.");
      await page.getByRole("button", { name: "Aggiorna articolo" }).click();
      await expect(page.getByText("Articolo aggiornato con successo.")).toBeVisible();

      await page.reload();
      await expect(page.getByLabel("Testo dell'articolo")).toHaveText("Testo aggiornato dopo la pubblicazione.");
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });

  test("Invia in approvazione senza titolo né categoria: errore lato client, nessuna chiamata al server", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });

    await loginViaUi(page, autore.email, autore.password);
    await page.goto("/autore/articoli/nuovo");

    let bozzaCreata = false;
    await page.route("**/api/v1/articoli/bozze", (route) => {
      bozzaCreata = true;
      return route.continue();
    });

    await page.getByRole("button", { name: "Invia in approvazione" }).click();
    await expect(
      page.getByText("Titolo e categoria sono obbligatori per inviare l'articolo in approvazione.")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/autore\/articoli\/nuovo$/);
    expect(bozzaCreata).toBe(false);
  });

  /**
   * Regressione: titolo e testo usavano text-chrome (#B8BEC7, DESIGN_SYSTEM.md:
   * "bordi, icone, testo secondario chiaro") invece di text-paper (#EDEEF0,
   * "testo primario su sfondo scuro") — chrome supera comunque la soglia WCAG
   * AA su surface-raised, ma è il ruolo semantico sbagliato per il contenuto
   * che l'autore sta scrivendo, risultando poco leggibile. Verifica sia il
   * colore calcolato sia — audit axe — che il contrasto resti conforme.
   */
  test("titolo e testo sono in paper (colore primario), non chrome/fog: leggibili mentre si scrive", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });

    await loginViaUi(page, autore.email, autore.password);
    await page.goto("/autore/articoli/nuovo");
    await expect(page.getByRole("heading", { name: "Nuovo Articolo" })).toBeVisible();

    await page.getByLabel("Titolo dell'articolo").fill("Titolo di prova leggibilità");
    await page.getByLabel("Testo dell'articolo").click();
    await page.getByLabel("Testo dell'articolo").pressSequentially("Testo di prova per verificare che il colore sia primario.");

    const colors = await page.evaluate(() => ({
      titolo: getComputedStyle(document.getElementById("editor-titolo")!).color,
      testo: getComputedStyle(document.getElementById("editor-testo")!).color,
    }));
    // #EDEEF0 = rgb(237, 238, 240) — non più #B8BEC7 (chrome, rgb(184, 190, 199)).
    expect(colors.titolo).toBe("rgb(237, 238, 240)");
    expect(colors.testo).toBe("rgb(237, 238, 240)");

    const axeResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(axeResults.violations).toEqual([]);
  });

  /**
   * Stessa dimensione/interlinea del corpo articolo in
   * ArticleDetailContent.tsx (cfr. articolo-dettaglio.spec.ts), per
   * coerenza tra scrittura e lettura: text-base/leading-loose, non più
   * text-sm/leading-relaxed.
   */
  test("il testo dell'articolo usa la stessa dimensione/interlinea della pagina di lettura", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });

    await loginViaUi(page, autore.email, autore.password);
    await page.goto("/autore/articoli/nuovo");
    await expect(page.getByRole("heading", { name: "Nuovo Articolo" })).toBeVisible();

    const metrics = await page.evaluate(() => {
      const style = getComputedStyle(document.getElementById("editor-testo")!);
      return { fontSize: style.fontSize, lineHeight: parseFloat(style.lineHeight) };
    });
    expect(metrics.fontSize).toBe("16px"); // text-base, non più text-sm (14px)
    expect(metrics.lineHeight).toBeCloseTo(32, 0); // leading-loose (2 × 16px), non più leading-relaxed
  });

  /**
   * Piano Markdown: verifica dal vivo dell'intero round-trip attraverso la
   * UI reale (non Markdown iniettato via API come in articolo-dettaglio.spec.ts)
   * — toolbar H2/H3/grassetto/corsivo, upload reale di un'immagine inline
   * (endpoint /immagini-corpo) con testo alternativo obbligatorio, salvataggio
   * come Markdown (lib/articoli/markdown.ts) e rendering pubblico via
   * react-markdown. MANAGER_AUTORI scrive e approva lo stesso articolo,
   * stesso pattern già usato da createPublishedArticle per gli helper API.
   */
  test("editor Markdown: H2/H3/grassetto/corsivo/immagine inline scritti dalla UI si pubblicano e si leggono correttamente", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaNome = `Editor Markdown E2E ${stamp}`;
    const titolo = `Guida editor Markdown ${stamp}`;

    await createCategory(manager.email, manager.password, categoriaNome);

    await loginViaUi(page, manager.email, manager.password);
    await page.goto("/autore/articoli/nuovo");
    await expect(page.getByRole("heading", { name: "Nuovo Articolo" })).toBeVisible();

    await page.getByLabel("Titolo dell'articolo").fill(titolo);

    const corpo = page.getByLabel("Testo dell'articolo");
    await corpo.click();
    await page.getByRole("button", { name: "H2", exact: true }).click();
    await corpo.pressSequentially("Il sistema frenante");
    await corpo.press("Enter");
    await corpo.pressSequentially("Un paragrafo con testo in ");
    await page.getByRole("button", { name: "Grassetto" }).click();
    await corpo.pressSequentially("grassetto");
    await page.getByRole("button", { name: "Grassetto" }).click();
    await corpo.pressSequentially(" e in ");
    await page.getByRole("button", { name: "Corsivo" }).click();
    await corpo.pressSequentially("corsivo");
    await page.getByRole("button", { name: "Corsivo" }).click();
    await corpo.pressSequentially(".");
    await corpo.press("Enter");
    await page.getByRole("button", { name: "H3", exact: true }).click();
    await corpo.pressSequentially("Dettaglio tecnico");
    await corpo.press("Enter");

    await page.getByTestId("inline-image-input").setInputFiles(INLINE_IMAGE_PATH);
    await expect(page.getByRole("heading", { name: "Descrivi l'immagine" })).toBeVisible();
    await page.getByLabel("Testo alternativo").fill("Schema del sistema frenante ABS");
    await page.getByRole("button", { name: "Inserisci", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Descrivi l'immagine" })).not.toBeVisible();
    await expect(corpo.getByRole("img", { name: "Schema del sistema frenante ABS" })).toBeVisible();

    await pickCategory(page, "Categoria", categoriaNome);

    await page.getByRole("button", { name: "Salva bozza" }).click();
    await page.waitForURL(/\/autore\/articoli\/\d+\/modifica$/);
    const id = Number(page.url().match(/\/autore\/articoli\/(\d+)\/modifica$/)![1]);

    await expect(page.getByRole("button", { name: "Invia in approvazione" })).toBeVisible();
    await page.getByRole("button", { name: "Invia in approvazione" }).click();
    await expect(page.getByText("Articolo inviato in approvazione.")).toBeVisible();
    await page.waitForURL("**/autore/articoli");

    try {
      await approveArticle(manager.email, manager.password, id);

      await page.goto(`/articoli/${id}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();

      const articolo = page.getByTestId("articolo-corpo");
      await expect(articolo.getByRole("heading", { name: "Il sistema frenante", level: 2 })).toBeVisible();
      await expect(articolo.getByRole("heading", { name: "Dettaglio tecnico", level: 3 })).toBeVisible();
      await expect(articolo.locator("strong")).toHaveText("grassetto");
      await expect(articolo.locator("em")).toHaveText("corsivo");
      const immaginePubblica = articolo.getByRole("img", { name: "Schema del sistema frenante ABS" });
      await expect(immaginePubblica).toBeVisible();

      // H2/H3 devono essere visivamente distinti, non solo tag diversi nel
      // DOM con la stessa dimensione calcolata (regressione: erano 20px/18px).
      const sizes = await page.evaluate(() => {
        const h2 = document.querySelector('[data-testid="articolo-corpo"] h2')!;
        const h3 = document.querySelector('[data-testid="articolo-corpo"] h3')!;
        return {
          h2: parseFloat(getComputedStyle(h2).fontSize),
          h3: parseFloat(getComputedStyle(h3).fontSize),
        };
      });
      expect(sizes.h2).toBeGreaterThan(sizes.h3);

      const axeResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeResults.violations).toEqual([]);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });
});
