import { test, expect } from "./fixtures";

const PASSWORD = "Sicura123!@#";
const NEW_PASSWORD = "AltraSicura456!@#";

test.describe("Recupero password", () => {
  test("email inesistente: mostra comunque il messaggio di conferma", async ({ page }) => {
    await page.goto("/recupero-password");
    await page.getByLabel("Email").fill("non-esiste-di-sicuro-e2e@example.com");
    await page.getByRole("button", { name: "Invia link di recupero" }).click();

    await expect(page.getByRole("heading", { name: "Controlla la tua email" })).toBeVisible();
  });

  test("email esistente: stesso messaggio di conferma (non-disclosure)", async ({
    page,
    testUsers,
  }) => {
    const { email } = await testUsers.create();

    await page.goto("/recupero-password");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Invia link di recupero" }).click();

    await expect(page.getByRole("heading", { name: "Controlla la tua email" })).toBeVisible();
  });
});

test.describe("Reimposta password", () => {
  test("token valido: aggiorna la password e mostra successo", async ({ page, testUsers }) => {
    const { email } = await testUsers.create();
    const token = await testUsers.requestPasswordReset(email);

    await page.goto(`/reimposta-password?token=${token}`);
    await page.getByLabel("Nuova password").fill(NEW_PASSWORD);
    await page.getByLabel("Conferma password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Reimposta password" }).click();

    await expect(page.getByRole("heading", { name: "Password aggiornata" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Vai al login" })).toHaveAttribute(
      "href",
      "/login"
    );

    // Verifica che la nuova password funzioni davvero per il login (non solo che la UI lo dica).
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Accedi" }).click();
    await expect(page).toHaveURL(/\/account$/);
  });

  test("password e conferma non coincidenti: toast di errore, resta sul form", async ({
    page,
    testUsers,
  }) => {
    const { email } = await testUsers.create();
    const token = await testUsers.requestPasswordReset(email);

    await page.goto(`/reimposta-password?token=${token}`);
    await page.getByLabel("Nuova password").fill(NEW_PASSWORD);
    await page.getByLabel("Conferma password").fill("UnaPasswordDiversa789!@#");
    await page.getByRole("button", { name: "Reimposta password" }).click();

    await expect(page.getByText("Le password non coincidono.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reimposta password" })).toBeVisible();
  });

  test("token già usato: toast di errore, resta sul form", async ({ page, testUsers }) => {
    const { email } = await testUsers.create();
    const token = await testUsers.requestPasswordReset(email);

    // Consuma il token una prima volta (come se l'utente avesse già cliccato il link e reimpostato).
    await fetch(`http://localhost:8080/api/v1/utenti/password/reset?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: PASSWORD }),
    });

    await page.goto(`/reimposta-password?token=${token}`);
    await page.getByLabel("Nuova password").fill(NEW_PASSWORD);
    await page.getByLabel("Conferma password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Reimposta password" }).click();

    await expect(
      page.getByText("Il link di recupero non e' valido, e' scaduto o e' gia' stato utilizzato.")
    ).toBeVisible();
  });

  test("token assente dalla query string: messaggio dedicato", async ({ page }) => {
    await page.goto("/reimposta-password");

    await expect(
      page.getByText("Link di reimpostazione non valido: manca il token.")
    ).toBeVisible();
  });
});
