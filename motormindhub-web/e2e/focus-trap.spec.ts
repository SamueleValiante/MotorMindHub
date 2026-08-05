import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";
import { getUserId } from "./helpers/test-users";

/**
 * Verifica di regressione per useFocusTrap (lib/shared/useFocusTrap.ts), su
 * due modali rappresentativi: SuspendAccountModal (azione distruttiva, con
 * onCancel passato come funzione inline dal chiamante — il caso che ha
 * motivato il pattern "latest ref" nell'hook) e CookieBanner (consenso
 * legale, dove Escape equivale a "Rifiuta tutti" e non a una chiusura
 * ambigua — cfr. la nota nel componente). Asserzioni vere, non un audit che
 * si limita a registrare risultati (quello è e2e/a11y-keyboard-audit.spec.ts).
 */

async function isFocusInside(page: import("@playwright/test").Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const container = document.querySelector(sel);
    return container ? container.contains(document.activeElement) : false;
  }, selector);
}

test.describe("Focus trap — SuspendAccountModal (azione distruttiva)", () => {
  test.beforeEach(async ({ page }) => {
    // Stesso motivo delle altre spec di quest'area: evita che il cookie
    // banner intercetti i click, non è l'oggetto di questo test.
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("il focus entra sul titolo, Tab resta intrappolato, Escape chiude e restituisce il focus al trigger", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    const target = await testUsers.create();
    const targetId = await getUserId(target.email);

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto(`/gestore/gestione-account/${targetId}`);

    const trigger = page.getByRole("button", { name: "Sospendi account" });
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Apertura: focus sul titolo (data-focus-trap-initial), non sul primo
    // controllo — annuncia il contesto prima di un select, pattern WAI-ARIA APG.
    await expect(page.locator("#sospendi-account-title")).toBeFocused();

    // Cambia motivazione a "ALTRO" per far comparire il campo condizionale
    // "Note aggiuntive": il ciclo di Tab qui sotto deve includerlo, prova che
    // gli elementi focusabili sono ricalcolati ad ogni pressione e non uno
    // snapshot preso all'apertura.
    await page.selectOption("#motivazione-sospensione", { label: "Altro (specificare nelle note)" });
    await expect(page.locator("#note-sospensione")).toBeVisible();

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      expect(await isFocusInside(page, '[role="dialog"]')).toBe(true);
    }
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await isFocusInside(page, '[role="dialog"]')).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
});

test.describe("Focus trap — CookieBanner (consenso, RNF6.1-RNF6.4)", () => {
  test("vista compatta: Tab resta nel banner, Escape rifiuta tutto e persiste il cookie", async ({ page }) => {
    // Contesto pulito, nessun consenso già deciso: il banner compare da solo.
    await page.goto("/");

    const banner = page.getByTestId("cookie-banner");
    await expect(banner).toBeVisible();

    await expect(page.getByRole("button", { name: "Personalizza" })).toBeFocused();

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      expect(await isFocusInside(page, '[data-testid="cookie-banner"]')).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(banner).not.toBeVisible();

    const cookies = await page.context().cookies();
    const consent = cookies.find((c) => c.name === "mmh_cookie_consent");
    expect(consent).toBeDefined();
    const value = JSON.parse(decodeURIComponent(consent!.value)) as { analitici: boolean };
    expect(value.analitici).toBe(false);
  });

  test("vista personalizza: Escape rifiuta comunque tutto, ignora la scelta non salvata", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Personalizza" }).click();
    await expect(page.getByRole("heading", { name: "Personalizza le preferenze cookie" })).toBeFocused();

    // Attiva il draft analitici ma non salva: Escape non deve mai tradursi
    // in un consenso silenzioso su questa scelta non confermata (Art. 4(11)/7
    // GDPR, Considerando 32).
    await page.getByRole("checkbox").nth(1).check();

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      expect(await isFocusInside(page, '[data-testid="cookie-banner"]')).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("cookie-banner")).not.toBeVisible();

    const cookies = await page.context().cookies();
    const consent = cookies.find((c) => c.name === "mmh_cookie_consent");
    expect(consent).toBeDefined();
    const value = JSON.parse(decodeURIComponent(consent!.value)) as { analitici: boolean };
    expect(value.analitici).toBe(false);
  });
});
