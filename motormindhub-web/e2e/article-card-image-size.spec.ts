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
 * Regressione: la copertina di ArticleCard (aspect-video, nessuna
 * larghezza propria) diventava altissima ovunque la card fosse dentro una
 * lista verticale a piena larghezza senza vincoli (I Miei Salvataggi, I
 * Miei Articoli, Dashboard Autore, Esplora, correlati in Dettaglio
 * Articolo) — solo la Home (grid md:grid-cols-2, che dimezza la colonna)
 * restava per caso entro dimensioni ragionevoli. Fix: max-h-80 (320px) sul
 * contenitore dell'immagine in ArticleCard stesso — un solo punto, copre
 * ogni pagina presente e futura che riusa il componente, senza serve
 * toccare il layout di ciascuna pagina (che resta a lista singola, come da
 * mockup 02/17/22).
 */
const MAX_REASONABLE_HEIGHT = 330; // max-h-80 (320px) + piccola tolleranza di rendering

async function assertCoverImagesWithinHeight(page: import("@playwright/test").Page) {
  // Scoped al wrapper interno di ArticleCard (cardContentClassName =
  // "flex flex-col gap-3", padre diretto della copertina): esclude i div/
  // img "aspect-video" usati altrove come hero a piena larghezza (es. la
  // copertina dell'articolo stesso in ArticleDetailContent, mt-8, fuori
  // scope di questo fix — è un elemento singolo, non una card di lista).
  const covers = page.locator(".flex.flex-col.gap-3 > div.aspect-video");
  // Attende la prima card invece di un count() one-shot: la lista dipende
  // da un fetch client-side (useArticleSearch/useUsers-equivalenti), un
  // controllo immediato dopo il solo heading (renderizzato anche negli
  // stati vuoto/caricamento) può correre prima che il risultato arrivi.
  await expect(covers.first()).toBeVisible();
  const count = await covers.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const box = await covers.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(MAX_REASONABLE_HEIGHT);
  }
}

test.describe("ArticleCard: copertina non eccessivamente grande su desktop", () => {
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

  test("Home, Esplora, I Miei Salvataggi, I Miei Articoli, Dashboard Autore, correlati in Dettaglio Articolo", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const iscritto = await testUsers.create();
    const stamp = Date.now();
    const categoriaNome = `Categoria card size ${stamp}`;

    const idAutore = await createPendingArticle(autore.email, autore.password, {
      titolo: `Articolo autore card size ${stamp}`,
      categoriaNome,
    });
    await approveArticle(manager.email, manager.password, idAutore);
    const idManager = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Articolo manager card size ${stamp}`,
      categoriaNome,
    });
    await saveArticleForUser(iscritto.email, iscritto.password, idAutore, "PREFERITI");

    try {
      // Home (controllo: già corretta prima del fix, deve restare tale).
      await page.goto("/", { waitUntil: "domcontentloaded" });
      if ((await page.locator(".flex.flex-col.gap-3 > div.aspect-video").count()) > 0) {
        await assertCoverImagesWithinHeight(page);
      }

      // Esplora (pubblico).
      await page.goto(`/esplora?query=${encodeURIComponent(String(stamp))}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(`2 risultati`, { exact: false })).toBeVisible();
      await assertCoverImagesWithinHeight(page);
      const axeEsplora = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeEsplora.violations).toEqual([]);

      // Dettaglio Articolo: correlati.
      await page.goto(`/articoli/${idAutore}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: `Altri articoli in ${categoriaNome}` })).toBeVisible();
      await assertCoverImagesWithinHeight(page);

      // I Miei Salvataggi (Iscritto).
      await loginViaUi(page, iscritto.email, iscritto.password);
      await page.goto("/account/salvataggi", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "I Miei Salvataggi" })).toBeVisible();
      await assertCoverImagesWithinHeight(page);
      const axeSalvataggi = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeSalvataggi.violations).toEqual([]);

      // I Miei Articoli (Autore).
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore/articoli", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "I Miei Articoli" })).toBeVisible();
      await assertCoverImagesWithinHeight(page);

      // Dashboard Autore ("I tuoi ultimi articoli").
      await page.goto("/autore", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "I tuoi ultimi articoli" })).toBeVisible();
      await assertCoverImagesWithinHeight(page);
      const axeDashboard = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeDashboard.violations).toEqual([]);
    } finally {
      await deleteArticle(manager.email, manager.password, idAutore);
      await deleteArticle(manager.email, manager.password, idManager);
    }
  });

  test("mobile: nessuna regressione, la copertina resta proporzionata al viewport stretto", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const iscritto = await testUsers.create();
    const stamp = Date.now();
    const id = await createPublishedArticle(manager.email, manager.password, {
      titolo: `Articolo mobile card size ${stamp}`,
      categoriaNome: `Categoria mobile card size ${stamp}`,
    });
    await saveArticleForUser(iscritto.email, iscritto.password, id, "PREFERITI");

    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await loginViaUi(page, iscritto.email, iscritto.password);
      await page.goto("/account/salvataggi", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "I Miei Salvataggi" })).toBeVisible();

      const cover = page.locator(".flex.flex-col.gap-3 > div.aspect-video").first();
      const box = await cover.boundingBox();
      expect(box).not.toBeNull();
      // A 390px di viewport l'aspect-video naturale (~219px) resta ben
      // sotto il cap (320px): il fix non deve MAI attivarsi qui, quindi
      // l'altezza deve seguire l'aspect-ratio 16:9 della larghezza reale,
      // non essere schiacciata al cap desktop.
      expect(box!.height).toBeLessThan(280);
      expect(box!.height).toBeGreaterThan(150);
    } finally {
      await deleteArticle(manager.email, manager.password, id);
    }
  });
});
