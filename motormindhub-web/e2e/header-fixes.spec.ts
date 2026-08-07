import { test, expect } from "./fixtures";
import { AxeBuilder } from "@axe-core/playwright";
import { loginViaUi } from "./helpers/ui";

test.describe("Logo più grande nel flusso di autenticazione", () => {
  test("il logo in AuthLayout è più grande di quello di default (PublicHeader/sidebar), senza sovrapporsi al form sotto", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    const logo = page.getByRole("img", { name: "MotorMindHub" });
    await expect(logo).toBeVisible();
    const logoBox = await logo.boundingBox();
    expect(logoBox).not.toBeNull();
    // h-16 (64px) qui, contro h-10 (40px) di default altrove.
    expect(logoBox!.height).toBeGreaterThanOrEqual(60);
    expect(logoBox!.height).toBeLessThanOrEqual(70);

    const heading = page.getByRole("heading", { name: "Bentornato" });
    await expect(heading).toBeVisible();
    const headingBox = await heading.boundingBox();
    expect(headingBox).not.toBeNull();
    // Nessuna sovrapposizione verticale: il logo finisce sopra il titolo, non sopra/dentro.
    expect(logoBox!.y + logoBox!.height).toBeLessThanOrEqual(headingBox!.y);
  });

  test("stessa dimensione maggiorata anche nella pagina di accettazione invito (stessa card isolata)", async ({
    page,
  }) => {
    // Token inesistente: la pagina mostra comunque la card con logo prima di
    // qualunque submit (nessuna chiamata di lettura all'apertura, cfr. commento nel componente).
    await page.goto("/inviti/token-inesistente-e2e/accetta", { waitUntil: "networkidle" });

    // La pagina vive sotto (public): eredita anche PublicHeader/PublicFooter,
    // ciascuno con il proprio logo a dimensione di default — va scoped a main.
    const logo = page.getByRole("main").getByRole("img", { name: "MotorMindHub" });
    await expect(logo).toBeVisible();
    const logoBox = await logo.boundingBox();
    expect(logoBox).not.toBeNull();
    expect(logoBox!.height).toBeGreaterThanOrEqual(60);
    expect(logoBox!.height).toBeLessThanOrEqual(70);
  });

  test("il logo resta a dimensione di default (non maggiorata) in PublicHeader", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const logo = page.getByRole("banner").getByRole("img", { name: "MotorMindHub" });
    const logoBox = await logo.boundingBox();
    expect(logoBox).not.toBeNull();
    // h-10 (40px): nettamente sotto la soglia usata in AuthLayout.
    expect(logoBox!.height).toBeLessThan(50);
  });
});

test.describe("UserMenu su mobile: Area personale/Esci visibili e funzionanti", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("il dropdown resta dentro il viewport e le voci sono cliccabili (regressione: prima finiva a x negativo, fuori schermo)", async ({
    page,
    testUsers,
  }) => {
    const user = await testUsers.create();
    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, user.email, user.password);
    await page.goto("/", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Apri menu" }).click();
    // Il chip UserMenu nel pannello mobile: unico bottone con aria-expanded visibile a questo viewport.
    const chip = page.locator('button[aria-expanded]').locator("visible=true");
    await expect(chip).toHaveCount(1);
    await chip.click();

    const areaPersonale = page.getByRole("link", { name: "Area personale" });
    const esci = page.getByRole("button", { name: "Esci" });
    await expect(areaPersonale).toBeVisible();
    await expect(esci).toBeVisible();

    const box = await areaPersonale.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);

    await areaPersonale.click();
    await expect(page).toHaveURL(/\/account$/);
  });

  test("su desktop il dropdown resta invariato: ancora dentro il viewport, cliccabile", async ({
    page,
    testUsers,
  }) => {
    const user = await testUsers.create();
    await loginViaUi(page, user.email, user.password);
    await page.goto("/", { waitUntil: "networkidle" });

    const chip = page.getByRole("banner").locator('button[aria-expanded]').locator("visible=true");
    await chip.click();

    const areaPersonale = page.getByRole("link", { name: "Area personale" });
    await expect(areaPersonale).toBeVisible();
    const box = await areaPersonale.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);

    await areaPersonale.click();
    await expect(page).toHaveURL(/\/account$/);
  });

  test("audit axe (WCAG 2.1 A+AA) sul dropdown UserMenu aperto — mobile e desktop, scenario Iscritto", async ({
    page,
    testUsers,
  }) => {
    // Gap reale: e2e/a11y-audit.spec.ts non copre mai PublicHeader in stato
    // autenticato (le route "Iscritto" sono tutte /account/*, dietro
    // AccountSidebar, che non monta mai PublicHeader/UserMenu) — qui si
    // aggiunge la copertura mancante, non solo un ricontrollo.
    const user = await testUsers.create();

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, user.email, user.password);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Apri menu" }).click();
    await page.locator('button[aria-expanded]').locator("visible=true").click();
    await expect(page.getByRole("link", { name: "Area personale" })).toBeVisible();

    const mobileResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(mobileResults.violations).toEqual([]);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("banner").locator('button[aria-expanded]').locator("visible=true").click();
    await expect(page.getByRole("link", { name: "Area personale" })).toBeVisible();

    const desktopResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(desktopResults.violations).toEqual([]);
  });
});

test.describe("Nessuna icona campanella nell'header pubblico", () => {
  test("da anonimo e da autenticato, nessuna icona notifiche nell'header desktop", async ({
    page,
    testUsers,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Path SVG distintivo della campanella rimossa: nessuna occorrenza in header.
    await expect(page.locator('header path[d*="M6 9a6 6 0 1 1 12 0"]')).toHaveCount(0);

    const user = await testUsers.create();
    await loginViaUi(page, user.email, user.password);
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator('header path[d*="M6 9a6 6 0 1 1 12 0"]')).toHaveCount(0);

    // Il blocco desktop autenticato contiene solo il chip UserMenu, non più due elementi.
    const authBlock = page.getByRole("banner").locator("div.md\\:flex").last();
    await expect(authBlock.locator("> *")).toHaveCount(1);
  });
});
