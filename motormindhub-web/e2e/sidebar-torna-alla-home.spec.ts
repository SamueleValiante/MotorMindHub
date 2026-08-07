import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";

/**
 * Il logo in cima a ciascuna sidebar autenticata è contestuale al ruolo,
 * non un unico link verso la home pubblica: per ISCRITTO (nessuna
 * dashboard propria, l'area self-service vive sotto /account) porta
 * davvero a / — per Autore/Manager/Gestore porta alla ROOT della propria
 * area (/autore, /manager, /gestore), mai a / o /account. Queste tre
 * sidebar non hanno alcun link verso la home pubblica: la loro unica
 * "home" è la propria dashboard.
 */
test.describe("Il logo nella sidebar torna alla home contestuale al ruolo", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("Iscritto: dal logo, da una sotto-pagina di /account, atterra sulla home pubblica", async ({
    page,
    testUsers,
  }) => {
    const iscritto = await testUsers.create();

    await loginViaUi(page, iscritto.email, iscritto.password);
    await page.goto("/account/impostazioni");
    await expect(page.getByRole("link", { name: "Panoramica" })).toBeVisible();

    await page.getByRole("link", { name: "MotorMindHub" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Esplora" })).toBeVisible();
  });

  test("Autore: dal logo, da Impostazioni Profilo, atterra sulla root della propria area (mai su / o /account)", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });

    await loginViaUi(page, autore.email, autore.password);
    await page.goto("/autore/impostazioni");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();

    // Nessun link verso la home pubblica in questa sidebar.
    await expect(page.getByRole("link", { name: "Torna alla home" })).toHaveCount(0);

    await page.getByRole("link", { name: "MotorMindHub" }).click();
    await expect(page).toHaveURL(/\/autore$/);
    await expect(page.getByRole("link", { name: "I Miei Articoli" })).toBeVisible();
    await expect(page.getByRole("banner")).not.toBeVisible();
  });

  test("Manager Autori: dal logo, da Impostazioni Profilo, atterra sulla root della propria area (mai su / o /account)", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });

    await loginViaUi(page, manager.email, manager.password);
    await page.goto("/manager/impostazioni");
    await expect(page.getByRole("link", { name: "Gestione Autori" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Torna alla home" })).toHaveCount(0);

    await page.getByRole("link", { name: "MotorMindHub" }).click();
    await expect(page).toHaveURL(/\/manager$/);
    await expect(page.getByRole("link", { name: "Gestione Categorie" })).toBeVisible();
    await expect(page.getByRole("banner")).not.toBeVisible();
  });

  test("Gestore Utenti: dal logo, da una sotto-pagina, atterra sulla root della propria area (mai su / o /account)", async ({
    page,
    testUsers,
  }) => {
    const gestore = await testUsers.create({ ruolo: "GESTORE_UTENTI" });

    await loginViaUi(page, gestore.email, gestore.password);
    await page.goto("/gestore/cronologia");
    await expect(page.getByRole("link", { name: "Gestione Account" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Torna alla home" })).toHaveCount(0);

    await page.getByRole("link", { name: "MotorMindHub" }).click();
    await expect(page).toHaveURL(/\/gestore$/);
    await expect(page.getByRole("link", { name: "Coda Segnalazioni" })).toBeVisible();
    await expect(page.getByRole("banner")).not.toBeVisible();
  });
});
