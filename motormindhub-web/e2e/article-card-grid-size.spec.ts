import { test, expect } from "./fixtures";
import { AxeBuilder } from "@axe-core/playwright";
import { loginViaUi } from "./helpers/ui";
import {
  createPendingArticle,
  createPublishedArticle,
  approveArticle,
  saveArticleForUser,
  deleteArticle,
} from "./helpers/test-articles";

/**
 * Regressione in due tempi:
 * 1) La copertina di ArticleCard (aspect-video, nessuna larghezza propria)
 *    diventava altissima ovunque la card fosse dentro una lista verticale
 *    a piena larghezza (I Miei Salvataggi, I Miei Articoli, Dashboard
 *    Autore, Esplora, correlati in Dettaglio Articolo) — solo la Home
 *    (grid md:grid-cols-2) restava per caso proporzionata.
 * 2) Un primo fix (max-h-80 dentro ArticleCard) risolveva l'altezza ma
 *    lasciava la CARD a piena larghezza del contenitore: coerente solo
 *    nell'altezza dell'immagine, non nella dimensione reale della card.
 *
 * Fix definitivo: la stessa griglia responsive della Home (grid
 * gap-6 md:grid-cols-2) applicata al contenitore in tutti e 5 i punti,
 * così la LARGHEZZA della colonna — non solo l'altezza dell'immagine —
 * è governata dallo stesso meccanismo ovunque. ArticleCard è tornato ad
 * aspect-video w-full puro: l'altezza corretta è una conseguenza della
 * larghezza corretta imposta dal contenitore, non va imposta due volte.
 *
 * La larghezza risultante NON è identica pixel-per-pixel in ogni pagina:
 * dipende dallo spazio disponibile nel layout ospitante (pagine con
 * Sidebar hanno ~256px in meno di spazio orizzontale della Home/Esplora,
 * che vivono nell'header pubblico), e i correlati nel Dettaglio Articolo
 * vivono dentro la colonna di lettura max-w-3xl (768px, per leggibilità
 * del testo, già così prima di questo fix) — più stretta per scelta di
 * design indipendente. Quello che deve essere costante è la REGOLA
 * (2 colonne su desktop, 1 su mobile), non il pixel esatto.
 */
const HOME_WIDTH_TOLERANCE = 160; // copre Esplora (Δ~50px) e le pagine con Sidebar (Δ~130px)

async function coverWidths(page: import("@playwright/test").Page): Promise<number[]> {
  const covers = page.locator(".flex.flex-col.gap-3 > div.aspect-video");
  await expect(covers.first()).toBeVisible();
  const count = await covers.count();
  const widths: number[] = [];
  for (let i = 0; i < count; i++) {
    const box = await covers.nth(i).boundingBox();
    expect(box).not.toBeNull();
    widths.push(box!.width);
  }
  return widths;
}

test.describe("ArticleCard: la card (non solo l'immagine) ha la stessa griglia ovunque", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test("Home, Esplora, I Miei Salvataggi, I Miei Articoli, Dashboard Autore: colonna larga quanto in Home (tolleranza)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const iscritto = await testUsers.create();
    const stamp = Date.now();
    const categoriaNome = `Categoria grid ${stamp}`;

    const idAutore = await createPendingArticle(autore.email, autore.password, {
      titolo: `Articolo autore grid ${stamp}`,
      categoriaNome,
    });
    await approveArticle(manager.email, manager.password, idAutore);
    const idManager = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Articolo manager grid ${stamp}`,
      categoriaNome,
    });
    await saveArticleForUser(iscritto.email, iscritto.password, idAutore, "PREFERITI");

    try {
      // Home: riferimento. Due articoli pubblicati -> due colonne piene.
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const homeWidths = await coverWidths(page);
      const homeWidth = homeWidths[0];
      // md:grid-cols-2 -> tutte le colonne della stessa riga hanno la
      // stessa larghezza, entro l'arrotondamento del layout.
      for (const w of homeWidths) expect(Math.abs(w - homeWidth)).toBeLessThan(5);

      // Esplora (pubblico, stesso max-w-6xl della Home).
      await page.goto(`/esplora?query=${encodeURIComponent(String(stamp))}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(`2 risultati`, { exact: false })).toBeVisible();
      const esploraWidths = await coverWidths(page);
      for (const w of esploraWidths) expect(Math.abs(w - homeWidth)).toBeLessThanOrEqual(HOME_WIDTH_TOLERANCE);

      // I Miei Salvataggi (Iscritto, layout con Sidebar).
      await loginViaUi(page, iscritto.email, iscritto.password);
      await page.goto("/account/salvataggi", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "I Miei Salvataggi" })).toBeVisible();
      const salvataggiWidths = await coverWidths(page);
      for (const w of salvataggiWidths) expect(Math.abs(w - homeWidth)).toBeLessThanOrEqual(HOME_WIDTH_TOLERANCE);
      const axeSalvataggi = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeSalvataggi.violations).toEqual([]);

      // I Miei Articoli (Autore, layout con Sidebar).
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore/articoli", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "I Miei Articoli" })).toBeVisible();
      const autoreArticoliWidths = await coverWidths(page);
      for (const w of autoreArticoliWidths) expect(Math.abs(w - homeWidth)).toBeLessThanOrEqual(HOME_WIDTH_TOLERANCE);

      // Dashboard Autore ("I tuoi ultimi articoli", layout con Sidebar).
      await page.goto("/autore", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "I tuoi ultimi articoli" })).toBeVisible();
      const dashboardWidths = await coverWidths(page);
      for (const w of dashboardWidths) expect(Math.abs(w - homeWidth)).toBeLessThanOrEqual(HOME_WIDTH_TOLERANCE);
      const axeDashboard = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeDashboard.violations).toEqual([]);
    } finally {
      await deleteArticle(manager.email, manager.password, idAutore);
      await deleteArticle(manager.email, manager.password, idManager);
    }
  });

  test("Dettaglio Articolo (correlati): 2 colonne, più stretta della Home per scelta di design (colonna di lettura max-w-3xl)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaNome = `Categoria correlati grid ${stamp}`;

    // 3 articoli nella stessa categoria: visitando il primo, i "correlati"
    // (altriArticoli in ArticleDetailContent) escludono l'articolo corrente
    // stesso, quindi servono almeno 2 ALTRI articoli nella categoria per
    // vedere 2 colonne affiancate — con solo 2 articoli totali (il corrente
    // + 1) resterebbe 1 solo correlato, insufficiente a verificare
    // l'affiancamento.
    const idCorrente = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Corrente grid ${stamp}`,
      categoriaNome,
    });
    const id1 = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Correlato uno grid ${stamp}`,
      categoriaNome,
    });
    const id2 = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Correlato due grid ${stamp}`,
      categoriaNome,
    });

    try {
      await page.goto(`/articoli/${idCorrente}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: `Altri articoli in ${categoriaNome}` })).toBeVisible();
      const widths = await coverWidths(page);
      // Con 2 correlati la griglia riempie entrambe le colonne: verifica
      // che siano effettivamente affiancate (stessa larghezza, non una
      // sopra l'altra come nella vecchia flex-col) e ben sotto la larghezza
      // piena della colonna di lettura (~672px prima del fix).
      expect(widths.length).toBe(2);
      expect(Math.abs(widths[0] - widths[1])).toBeLessThan(5);
      expect(widths[0]).toBeLessThan(400);
      expect(widths[0]).toBeGreaterThan(250);
    } finally {
      await deleteArticle(manager.email, manager.password, idCorrente);
      await deleteArticle(manager.email, manager.password, id1);
      await deleteArticle(manager.email, manager.password, id2);
    }
  });

  /**
   * Regressione: con un solo correlato, md:grid-cols-2 riservava comunque
   * 2 tracce (CSS Grid le definisce a prescindere dal numero di figli) —
   * l'unica card occupava solo la prima, lasciando la seconda vuota nello
   * stesso riquadro bordato ("Altri articoli"): sembrava che l'immagine non
   * riempisse la card, in realtà la card stessa riempiva solo metà del
   * riquadro. Fix: niente md:grid-cols-2 quando altriArticoli.length === 1,
   * la card unica occupa l'intera larghezza del riquadro (stesso
   * comportamento a una colonna già corretto su mobile).
   */
  test("Dettaglio Articolo (correlati): un solo risultato riempie l'intera larghezza del riquadro, non solo metà", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const stamp = Date.now();
    const categoriaNome = `Categoria correlati singolo ${stamp}`;

    const idCorrente = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Corrente singolo ${stamp}`,
      categoriaNome,
    });
    const idCorrelato = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Correlato singolo ${stamp}`,
      categoriaNome,
    });

    try {
      await page.goto(`/articoli/${idCorrente}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: `Altri articoli in ${categoriaNome}` })).toBeVisible();

      const metrics = await page.evaluate(() => {
        const section = Array.from(document.querySelectorAll("section")).find((s) =>
          s.textContent?.includes("Altri articoli")
        )!;
        const panel = section.querySelector(":scope > div.grid")!;
        const cover = panel.querySelector(":scope .aspect-video")!;
        const panelStyle = getComputedStyle(panel);
        // p-6 su entrambi i lati: la copertina riempie il CONTENT box del
        // riquadro (border-box meno il padding), non il suo border-box —
        // panel.getBoundingClientRect() include p-6, cover no.
        const panelContentWidth =
          panel.getBoundingClientRect().width -
          parseFloat(panelStyle.paddingLeft) -
          parseFloat(panelStyle.paddingRight);
        return {
          gridTemplateColumns: panelStyle.gridTemplateColumns,
          panelContentWidth,
          coverWidth: cover.getBoundingClientRect().width,
        };
      });
      // Una sola traccia di grid (niente md:grid-cols-2 riservato a vuoto)...
      expect(metrics.gridTemplateColumns.trim().split(/\s+/)).toHaveLength(1);
      // ...e la copertina riempie l'intero content box del riquadro, non solo
      // metà (tolleranza 3px: il border 1px del riquadro, non sottratto sopra
      // insieme al padding, entra nella differenza).
      expect(Math.abs(metrics.coverWidth - metrics.panelContentWidth)).toBeLessThan(3);

      const axeResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeResults.violations).toEqual([]);
    } finally {
      await deleteArticle(manager.email, manager.password, idCorrente);
      await deleteArticle(manager.email, manager.password, idCorrelato);
    }
  });

  test("mobile: la griglia collassa a una colonna ovunque, come già in Home", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const iscritto = await testUsers.create();
    const stamp = Date.now();
    const id1 = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Mobile grid uno ${stamp}`,
      categoriaNome: `Categoria mobile grid ${stamp}`,
    });
    const id2 = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Mobile grid due ${stamp}`,
      categoriaNome: `Categoria mobile grid ${stamp}`,
    });
    await saveArticleForUser(iscritto.email, iscritto.password, id1, "PREFERITI");
    await saveArticleForUser(iscritto.email, iscritto.password, id2, "LEGGI_PIU_TARDI");

    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await loginViaUi(page, iscritto.email, iscritto.password);
      await page.goto("/account/salvataggi", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "I Miei Salvataggi" })).toBeVisible();

      const covers = page.locator(".flex.flex-col.gap-3 > div.aspect-video");
      await expect(covers).toHaveCount(2);
      const box0 = await covers.nth(0).boundingBox();
      const box1 = await covers.nth(1).boundingBox();
      expect(box0).not.toBeNull();
      expect(box1).not.toBeNull();
      // Nessuna griglia a 2 colonne sotto md: stessa larghezza (piena riga)
      // e la seconda card sta SOTTO la prima, non affiancata.
      expect(Math.abs(box0!.width - box1!.width)).toBeLessThan(5);
      expect(box1!.y).toBeGreaterThan(box0!.y + box0!.height - 5);
    } finally {
      await deleteArticle(manager.email, manager.password, id1);
      await deleteArticle(manager.email, manager.password, id2);
    }
  });
});
