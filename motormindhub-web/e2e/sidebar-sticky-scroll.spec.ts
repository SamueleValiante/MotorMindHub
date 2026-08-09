import { test, expect } from "./fixtures";
import { AxeBuilder } from "@axe-core/playwright";
import { loginViaUi } from "./helpers/ui";
import {
  createPublishedArticle,
  createPendingArticle,
  approveArticle,
  saveArticleForUser,
  deleteArticle,
  login,
} from "./helpers/test-articles";

/**
 * Regressione: la Sidebar (Account/Autore/Manager/Gestore, stesso layout
 * ripetuto identico nei 4 componenti) non aveva mai `position: sticky` —
 * era un blocco statico con `h-screen` fisso. Su pagine con contenuto più
 * alto di un viewport, il div flex del layout cresce naturalmente oltre
 * i 100vh (min-h-screen è un minimo, non un tetto) e a scrollare è la
 * PAGINA, non <main> internamente (il suo overflow-y-auto non aveva mai
 * nulla su cui attivarsi, rimosso insieme a questo fix perché inerte):
 * la Sidebar, statica, scorreva via con tutto il resto invece di restare
 * agganciata in alto — visibile solo per il primo tratto di scroll (la sua
 * stessa altezza), poi fuori viewport per il resto della pagina.
 *
 * Fix: `sticky top-0` sulla Sidebar. Il "binario" su cui sticky si aggancia
 * era già alto quanto serve (il div flex genitore segue naturalmente
 * l'altezza di <main>, reso esplicito con md:items-stretch) — mancava solo
 * la posizione sticky sulla Sidebar stessa.
 */
async function assertSidebarStaysAtTop(page: import("@playwright/test").Page) {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  // La lista dipende da un fetch client-side successivo al render
  // dell'heading (già atteso dal chiamante): scrollHeight letto troppo
  // presto vede ancora la pagina "vuota". expect.poll ritenta finché il
  // contenuto reale non è arrivato, invece di un'attesa fissa fragile.
  // Il contenuto deve anche essere davvero più alto della viewport,
  // altrimenti il test non eserciterebbe lo scroll che riproduce il bug.
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight), { timeout: 10_000 })
    .toBeGreaterThan(viewport!.height + 200);
  const before = await page.evaluate(() => document.documentElement.scrollHeight);

  await page.mouse.wheel(0, before);
  await page.waitForTimeout(300);

  const aside = page.locator("aside");
  const box = await aside.boundingBox();
  expect(box).not.toBeNull();
  // Sticky agganciata in cima al viewport (top: 0): non più a un top
  // negativo grande come prima del fix (scorreva via con la pagina).
  expect(Math.abs(box!.y)).toBeLessThan(3);
}

test.describe("Sidebar: resta agganciata in cima durante lo scroll su contenuto lungo", () => {
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

  test("Account (I Miei Salvataggi)", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const iscritto = await testUsers.create();
    const stamp = Date.now();
    const managerToken = await login(manager.email, manager.password);
    const ids: number[] = [];

    for (let i = 0; i < 6; i++) {
      const id = await createPublishedArticle(
        manager.email,
        manager.password,
        { titolo: `Sidebar sticky salvataggi ${stamp} ${i}`, categoriaNome: `Sidebar sticky cat salvataggi ${stamp}` },
        managerToken
      );
      ids.push(id);
      await saveArticleForUser(iscritto.email, iscritto.password, id, i % 2 === 0 ? "PREFERITI" : "LEGGI_PIU_TARDI");
    }

    try {
      await loginViaUi(page, iscritto.email, iscritto.password);
      await page.goto("/account/salvataggi", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "I Miei Salvataggi" })).toBeVisible();
      await assertSidebarStaysAtTop(page);

      const axeResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(axeResults.violations).toEqual([]);
    } finally {
      for (const id of ids) await deleteArticle(manager.email, manager.password, id, managerToken).catch(() => {});
    }
  });

  test("Autore (I Miei Articoli)", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const managerToken = await login(manager.email, manager.password);
    const autoreToken = await login(autore.email, autore.password);
    const ids: number[] = [];

    for (let i = 0; i < 8; i++) {
      const id = await createPendingArticle(
        autore.email,
        autore.password,
        { titolo: `Sidebar sticky autore ${stamp} ${i}`, categoriaNome: `Sidebar sticky cat autore ${stamp}` },
        autoreToken
      );
      await approveArticle(manager.email, manager.password, id, managerToken);
      ids.push(id);
    }

    try {
      await loginViaUi(page, autore.email, autore.password);
      await page.goto("/autore/articoli", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "I Miei Articoli" })).toBeVisible();
      await assertSidebarStaysAtTop(page);
    } finally {
      for (const id of ids) await deleteArticle(manager.email, manager.password, id, managerToken).catch(() => {});
    }
  });

  test("Manager (coda Articoli in Attesa)", async ({ page, testUsers }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });
    const autore = await testUsers.create({ ruolo: "AUTORE" });
    const stamp = Date.now();
    const autoreToken = await login(autore.email, autore.password);
    const ids: number[] = [];

    for (let i = 0; i < 15; i++) {
      const id = await createPendingArticle(
        autore.email,
        autore.password,
        { titolo: `Sidebar sticky manager ${stamp} ${i}`, categoriaNome: `Sidebar sticky cat manager ${stamp}` },
        autoreToken
      );
      ids.push(id);
    }

    try {
      await loginViaUi(page, manager.email, manager.password);
      await page.goto("/manager/articoli-in-attesa", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Articoli in Attesa di Approvazione" })).toBeVisible();
      await assertSidebarStaysAtTop(page);
    } finally {
      // deleteArticle accetta IN_ATTESA_APPROVAZIONE direttamente (precondizione
      // estesa a qualunque stato diverso da BOZZA), nessuna approvazione necessaria qui.
      const managerToken = await login(manager.email, manager.password);
      for (const id of ids) {
        await deleteArticle(manager.email, manager.password, id, managerToken).catch(() => {});
      }
    }
  });

  test("Gestore (Gestione Account)", async ({ page, testUsers }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    for (let i = 0; i < 10; i++) {
      await testUsers.create();
    }

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/gestione-account", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Gestione Account" })).toBeVisible();
    await assertSidebarStaysAtTop(page);

    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test("mobile: nessuna regressione, la Sidebar resta un menu diverso (topbar), non sticky", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });
    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/gestione-account", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Gestione Account" })).toBeVisible();

    // A questo breakpoint <aside> è hidden (md:flex la mostra solo da md
    // in su): sticky su un elemento display:none è innocuo, ma verifica
    // esplicitamente che il topbar mobile (<header>, non sticky) resti al
    // suo posto e non venga influenzato dal fix.
    await expect(page.locator("aside")).toBeHidden();
    const header = page.locator("header");
    await expect(header).toBeVisible();
    const positionBefore = await header.evaluate((el) => getComputedStyle(el).position);
    expect(positionBefore).toBe("static");
  });
});
