import { test, expect } from "./fixtures";
import { AxeBuilder } from "@axe-core/playwright";

/**
 * Layout condiviso da tutte le pagine del flusso auth (app/(auth)/layout.tsx,
 * un solo file: login, registrazione, conferma-email, recupero-password,
 * reimposta-password). Due uscite verso "/" (la home pubblica), non una
 * nav pubblica intera: il logo (icona, stesso principio già applicato in
 * PublicHeader e in ogni Sidebar autenticata) e un link testuale discreto
 * "← Torna alla home" accanto - qui il visitatore è anonimo, magari alla
 * prima visita, e non ha ancora la familiarità con la convenzione
 * "il logo riporta alla home" che ha un utente già autenticato (per cui
 * la sola icona nelle sidebar interne resta sufficiente, non cambiata).
 */
test.describe("Layout auth: due uscite verso la home pubblica (logo + link testuale)", () => {
  for (const path of ["/login", "/registrazione", "/conferma-email", "/recupero-password", "/reimposta-password"]) {
    test(`${path}: logo e link "Torna alla home" puntano entrambi a "/", nessuna nav aggiuntiva`, async ({
      page,
    }) => {
      await page.goto(path);

      const logoLink = page.getByRole("link", { name: "MotorMindHub" });
      await expect(logoLink).toBeVisible();
      await expect(logoLink).toHaveAttribute("href", "/");

      // Testo accessibile chiaro (non solo una freccia): getByRole con
      // l'accessible name completo, non un selettore CSS sulla freccia.
      const backLink = page.getByRole("link", { name: "← Torna alla home" });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute("href", "/");

      // Nessuna nav aggiuntiva introdotta insieme a logo/link (niente header
      // pubblico completo, solo le due uscite dentro la card).
      expect(await page.locator("nav").count()).toBe(0);

      // Audit sulla pagina auth stessa (con entrambi i link), prima di
      // navigare via - un audit dopo il click controllerebbe la Home,
      // già coperta altrove.
      const axeResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeResults.violations).toEqual([]);

      await backLink.click();
      await page.waitForURL((url) => url.pathname === "/");
    });
  }
});
