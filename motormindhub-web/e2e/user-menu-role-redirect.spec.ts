import { test, expect } from "./fixtures";
import { AxeBuilder } from "@axe-core/playwright";
import type { TestRuolo } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { createPublishedArticle, deleteArticle } from "./helpers/test-articles";

/**
 * Rispecchia AREA_PERSONALE (components/public/UserMenu.tsx): ISCRITTO non
 * ha un'area di lavoro dedicata e resta su /account con l'etichetta
 * storica, gli altri 3 ruoli hanno una dashboard propria — stessa logica già
 * verificata per il link del Logo in ciascuna Sidebar di ruolo.
 */
const AREA_PERSONALE: Record<TestRuolo, { label: string; href: string; heading: string | RegExp }> = {
  ISCRITTO: { label: "Area personale", href: "/account", heading: /^Ciao, / },
  AUTORE: { label: "La mia Dashboard", href: "/autore", heading: "Dashboard" },
  MANAGER_AUTORI: { label: "La mia Dashboard", href: "/manager", heading: "Dashboard Manageriale" },
  GESTORE_UTENTI: { label: "La mia Dashboard", href: "/gestore", heading: "Dashboard Gestione Utenti" },
};

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("UserMenu porta alla dashboard del proprio ruolo, non sempre a /account", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  for (const ruolo of ["ISCRITTO", "AUTORE", "MANAGER_AUTORI", "GESTORE_UTENTI"] as const) {
    test(`${ruolo}: header pubblico su Dettaglio Articolo, voce menu verso la propria area${
      ruolo === "ISCRITTO" ? "" : ", /account digitato a mano rimanda alla dashboard"
    }`, async ({ page, testUsers }) => {
      const { label, href, heading } = AREA_PERSONALE[ruolo];

      // MANAGER_AUTORI può creare e approvare da solo (hasAnyRole
      // AUTORE/MANAGER_AUTORI sulla bozza, hasRole MANAGER_AUTORI
      // sull'approvazione); per gli altri 3 ruoli serve un manager
      // dedicato solo a pubblicare l'articolo di prova, l'account sotto
      // test non serve altro che per login/menu/redirect.
      const manager = ruolo === "MANAGER_AUTORI" ? null : await testUsers.create({ ruolo: "MANAGER_AUTORI" });
      const user = await testUsers.create({ ruolo });
      const articleOwner = manager ?? user;

      const stamp = Date.now();
      const titolo = `Articolo menu ruolo ${ruolo} ${stamp}`;
      const articleId = await createPublishedArticle(articleOwner.email, articleOwner.password, {
        titolo,
        categoriaNome: `Categoria menu ruolo ${ruolo} ${stamp}`,
      });

      try {
        await loginViaUi(page, user.email, user.password);

        // 1. Dettaglio Articolo pubblico: header pubblico visibile e invariato.
        await page.goto(`/articoli/${articleId}`);
        await expect(page.getByRole("heading", { name: titolo })).toBeVisible();
        const banner = page.getByRole("banner");
        await expect(banner).toBeVisible();
        await expect(banner.getByRole("img", { name: "MotorMindHub" })).toBeVisible();

        // 2. Voce del menu profilo: etichetta e destinazione del proprio ruolo.
        const chip = banner.locator('button[aria-expanded]').locator("visible=true");
        await chip.click();
        const areaLink = page.getByRole("link", { name: label });
        await expect(areaLink).toBeVisible();
        await expect(page.getByRole("button", { name: "Esci" })).toBeVisible();

        const axeResults = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
        expect(axeResults.violations).toEqual([]);

        await areaLink.click();
        await page.waitForURL(`**${href}`);
        await expect(
          page.getByRole("heading", { name: heading, exact: typeof heading === "string" })
        ).toBeVisible();

        // 3. Solo per i ruoli con dashboard propria: /account digitato a
        // mano non concede più accesso, rimanda alla dashboard del ruolo
        // (stessa falla già chiusa per GESTORE_UTENTI, ora estesa a tutti
        // e tre i ruoli non-Iscritto).
        if (ruolo !== "ISCRITTO") {
          await page.goto("/account");
          await page.waitForURL(`**${href}`);
          await expect(
            page.getByRole("heading", { name: heading, exact: typeof heading === "string" })
          ).toBeVisible();
        } else {
          // ISCRITTO: /account resta raggiungibile, nessun redirect.
          await page.goto("/account");
          await expect(page).toHaveURL(/\/account$/);
          await expect(
            page.getByRole("heading", { name: heading, exact: typeof heading === "string" })
          ).toBeVisible();
        }
      } finally {
        await deleteArticle(articleOwner.email, articleOwner.password, articleId);
      }
    });
  }
});
