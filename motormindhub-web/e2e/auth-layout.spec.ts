import { test, expect } from "./fixtures";
import { AxeBuilder } from "@axe-core/playwright";

/**
 * Layout condiviso da tutte le pagine del flusso auth (app/(auth)/layout.tsx,
 * un solo file: login, registrazione, conferma-email, recupero-password,
 * reimposta-password). Il logo deve essere cliccabile verso "/" (la home
 * pubblica) - solo il logo, non un header pubblico intero con nav/menu
 * profilo: stesso principio già applicato in PublicHeader e in ogni Sidebar
 * autenticata (Logo linkato da solo, contestuale).
 */
test.describe("Layout auth: logo cliccabile verso la home pubblica", () => {
  for (const path of ["/login", "/registrazione", "/conferma-email", "/recupero-password", "/reimposta-password"]) {
    test(`${path}: il logo linka a "/" senza introdurre nav aggiuntiva`, async ({ page }) => {
      await page.goto(path);

      const logoLink = page.getByRole("link", { name: "MotorMindHub" });
      await expect(logoLink).toBeVisible();
      await expect(logoLink).toHaveAttribute("href", "/");

      // Nessuna nav aggiuntiva introdotta insieme al logo (niente header
      // pubblico completo, solo il link sul logo dentro la card).
      expect(await page.locator("nav").count()).toBe(0);

      // Audit sulla pagina auth stessa (con il link appena aggiunto), prima
      // di navigare via - un audit dopo il click controllerebbe la Home,
      // già coperta altrove.
      const axeResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeResults.violations).toEqual([]);

      await logoLink.click();
      await page.waitForURL((url) => url.pathname === "/");
    });
  }
});
