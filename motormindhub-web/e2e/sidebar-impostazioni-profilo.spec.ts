import { test, expect } from "./fixtures";
import { loginViaUi } from "./helpers/ui";

/**
 * "Impostazioni Profilo" in AutoreSidebar/ManagerSidebar punta a
 * /autore/impostazioni e /manager/impostazioni rispettivamente — non a
 * /account/impostazioni (usata solo da ISCRITTO): quella rotta vive dentro
 * app/account/layout.tsx, quindi raggiungerla da un Autore/Manager
 * sostituirebbe la loro sidebar con AccountSidebar, un cambio di contesto
 * sbagliato. Le due nuove pagine riusano lo stesso ProfileSettingsForm
 * condiviso, montate dentro il proprio layout di ruolo.
 */
test.describe("Impostazioni Profilo raggiungibile dalla sidebar (Autore/Manager Autori)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "mmh_cookie_consent",
        value: encodeURIComponent(JSON.stringify({ analitici: true, decidedAt: new Date().toISOString() })),
        url: "http://localhost:3000",
      },
    ]);
  });

  test("Autore: sidebar -> Impostazioni Profilo -> sidebar Autore mai sostituita -> dati precaricati -> modifica -> salva -> persistenza", async ({
    page,
    testUsers,
  }) => {
    const autore = await testUsers.create({ ruolo: "AUTORE" });

    await loginViaUi(page, autore.email, autore.password);
    await expect(page).toHaveURL(/\/autore$/);

    await page.getByRole("link", { name: "Impostazioni Profilo" }).click();
    await expect(page).toHaveURL(/\/autore\/impostazioni$/);

    // La sidebar è ancora quella di Autore (voci esclusive presenti), mai
    // sostituita da AccountSidebar (voci esclusive di quella assenti).
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "I Miei Articoli" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Panoramica" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "I Miei Salvataggi" })).not.toBeVisible();

    await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("E2E");
    await expect(page.getByLabel("Cognome")).toHaveValue("Test");
    await expect(page.getByLabel("Email")).toHaveValue(autore.email);

    const nuovaBio = `Autore E2E, biografia aggiornata ${Date.now()}`;
    await page.getByLabel("Biografia").fill(nuovaBio);
    await page.getByRole("button", { name: "Salva modifiche" }).click();

    await expect(page.getByText("Profilo aggiornato con successo.")).toBeVisible();
    await expect(page).toHaveURL(/\/autore$/);
    // Ancora sidebar Autore dopo il redirect post-salvataggio.
    await expect(page.getByRole("link", { name: "I Miei Articoli" })).toBeVisible();

    // Persistenza reale lato backend, non solo stato locale del form appena inviato.
    await page.goto("/autore/impostazioni");
    await expect(page.getByLabel("Biografia")).toHaveValue(nuovaBio);
  });

  test("Manager Autori: sidebar -> Impostazioni Profilo -> sidebar Manager mai sostituita -> dati precaricati -> modifica -> salva -> persistenza", async ({
    page,
    testUsers,
  }) => {
    const manager = await testUsers.create({ ruolo: "MANAGER_AUTORI" });

    await loginViaUi(page, manager.email, manager.password);
    await expect(page).toHaveURL(/\/manager$/);

    await page.getByRole("link", { name: "Impostazioni Profilo" }).click();
    await expect(page).toHaveURL(/\/manager\/impostazioni$/);

    await expect(page.getByRole("link", { name: "Gestione Autori" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Gestione Categorie" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Panoramica" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "I Miei Salvataggi" })).not.toBeVisible();

    await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("E2E");
    await expect(page.getByLabel("Cognome")).toHaveValue("Test");
    await expect(page.getByLabel("Email")).toHaveValue(manager.email);

    const nuovaBio = `Manager E2E, biografia aggiornata ${Date.now()}`;
    await page.getByLabel("Biografia").fill(nuovaBio);
    await page.getByRole("button", { name: "Salva modifiche" }).click();

    await expect(page.getByText("Profilo aggiornato con successo.")).toBeVisible();
    await expect(page).toHaveURL(/\/manager$/);
    await expect(page.getByRole("link", { name: "Gestione Autori" })).toBeVisible();

    await page.goto("/manager/impostazioni");
    await expect(page.getByLabel("Biografia")).toHaveValue(nuovaBio);
  });
});
