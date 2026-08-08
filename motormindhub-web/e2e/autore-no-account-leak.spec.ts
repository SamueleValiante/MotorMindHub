import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { createPublishedArticle, deleteArticle } from "./helpers/test-articles";

/**
 * Regressione: un Autore autenticato poteva raggiungere "/" (l'home
 * pubblica pensata per anonimi/Iscritto) sia dal Logo sia dalla voce
 * "Home" della nav di PublicHeader — nessuno dei due controllava il ruolo,
 * a differenza del Logo di ogni Sidebar di ruolo (che linka già alla
 * dashboard propria) e della voce del menu profilo (UserMenu, corretta in
 * precedenza). La home di un Autore è /autore: nessun link verso "/" o
 * "/account" deve comparire in nessuno stato della UI per questo ruolo.
 */
async function hrefsOnPage(page: import("@playwright/test").Page): Promise<Array<[string | null, string | null]>> {
  return page.locator("a[href]").evaluateAll((els) =>
    els.map((e) => [e.textContent?.trim() ?? null, e.getAttribute("href")])
  );
}

test.describe("AUTORE: nessun riferimento all'area Iscritto (/account, /, \"Area personale\")", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("dashboard, impostazioni, header pubblico e redirect: solo /autore, mai /account o /", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const titolo = `Articolo no-leak ${stamp}`;
    const articleId = await createPublishedArticle(manager.email, manager.password, {
      titolo,
      categoriaNome: `Categoria no-leak ${stamp}`,
    });

    try {
      await loginViaUi(page, autore.email, autore.password);
      await expect(page).toHaveURL(/\/autore$/);
      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();

      // 1. Sidebar (/autore, dashboard): il Logo linka già alla dashboard
      // propria (comportamento preesistente, verificato qui come rete di
      // sicurezza), nessun /account in nessun link della pagina.
      let hrefs = await hrefsOnPage(page);
      expect(hrefs.some(([, href]) => href === "/account")).toBe(false);
      expect(hrefs.some(([, href]) => href === "/")).toBe(false);
      expect(await page.locator("body").innerText()).not.toContain("Area personale");

      // 2. /autore/impostazioni: stesso controllo (ProfileSettingsForm è
      // condiviso con /account/impostazioni, "Annulla" deve restare
      // ancorato a /autore).
      await page.goto("/autore/impostazioni");
      await expect(page.getByRole("heading", { name: "Impostazioni profilo" })).toBeVisible();
      hrefs = await hrefsOnPage(page);
      expect(hrefs.some(([, href]) => href === "/account")).toBe(false);
      expect(hrefs.some(([, href]) => href === "/")).toBe(false);

      // 3. Dettaglio Articolo pubblico (PublicHeader, la causa reale del
      // bug): niente voce "Home" nella nav, il Logo non punta più a "/" ma
      // alla dashboard, il menu profilo mostra solo "La mia Dashboard".
      await page.goto(`/articoli/${articleId}`);
      await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
      const banner = page.getByRole("banner");
      await expect(banner).toBeVisible();
      await expect(banner.getByRole("link", { name: "Home", exact: true })).toHaveCount(0);

      const logoLink = banner.getByRole("link").filter({ has: page.getByRole("img", { name: "MotorMindHub" }) });
      await expect(logoLink).toHaveAttribute("href", "/autore");

      const chip = banner.locator("button[aria-expanded]").locator("visible=true");
      await chip.click();
      await expect(page.getByRole("link", { name: "La mia Dashboard" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Area personale" })).toHaveCount(0);

      hrefs = await hrefsOnPage(page);
      expect(hrefs.filter(([, href]) => href === "/account")).toEqual([]);
      expect(hrefs.filter(([, href]) => href === "/")).toEqual([]);
      expect(await page.locator("body").innerText()).not.toContain("Area personale");

      // 4. Stesso controllo su mobile (nav duplicata in PublicHeader).
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/articoli/${articleId}`);
      await page.getByRole("button", { name: "Apri menu" }).click();
      await expect(banner.getByRole("link", { name: "Home", exact: true })).toHaveCount(0);

      // 5. Redirect: /account digitato a mano rimanda alla dashboard, non
      // concede accesso all'area Iscritto (regressione già coperta altrove,
      // ripetuta qui perché il punto 3 dell'indagine la richiedeva
      // esplicitamente per questo ruolo).
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/account");
      await page.waitForURL("**/autore");
      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    } finally {
      await deleteArticle(manager.email, manager.password, articleId);
    }
  });
});
