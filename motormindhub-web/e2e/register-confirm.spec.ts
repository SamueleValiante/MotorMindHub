import { test, expect } from "./fixtures";

const PASSWORD = "Sicura123!@#";

test.describe("Registrazione", () => {
  test("submit riuscito: mostra 'controlla la tua email', nessun redirect automatico", async ({
    page,
    testUsers,
  }) => {
    const email = `e2e-${test.info().testId}-${Date.now()}@example.com`;
    testUsers.trackForCleanup(email);

    await page.goto("/registrazione");
    await page.getByLabel("Nome", { exact: true }).fill("E2E");
    await page.getByLabel("Cognome").fill("Registrazione");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByText("Accetto i Termini di Servizio").click();
    await page.getByRole("button", { name: "Crea account" }).click();

    await expect(page.getByText("Controlla la tua email")).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page).toHaveURL(/\/registrazione$/);
  });

  test("email già registrata: toast di errore, resta sul form", async ({ page, testUsers }) => {
    const { email } = await testUsers.create();

    await page.goto("/registrazione");
    await page.getByLabel("Nome", { exact: true }).fill("E2E");
    await page.getByLabel("Cognome").fill("Duplicato");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByText("Accetto i Termini di Servizio").click();
    await page.getByRole("button", { name: "Crea account" }).click();

    await expect(page.getByText("Un account con questo indirizzo email esiste gia'.")).toBeVisible();
    // Resta sul form (non è passato alla vista "controlla la tua email").
    await expect(page.getByRole("button", { name: "Crea account" })).toBeVisible();
  });
});

test.describe("Conferma email", () => {
  test("token valido: successo e link al login", async ({ page, testUsers }) => {
    const { verificationToken } = await testUsers.create({ unverified: true });

    await page.goto(`/conferma-email?token=${verificationToken}`);

    await expect(page.getByRole("heading", { name: "Account attivato" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Vai al login" })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  test("token già usato: messaggio di link non valido", async ({ page, testUsers }) => {
    const { verificationToken } = await testUsers.create({ unverified: true });

    // Consuma il token una prima volta (come se l'utente avesse già cliccato il link).
    await fetch(`http://localhost:8080/api/v1/utenti/verifica-email?token=${verificationToken}`);

    await page.goto(`/conferma-email?token=${verificationToken}`);

    await expect(
      page.getByText("Il link di verifica non e' valido o e' gia' stato utilizzato.")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Torna al login" })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  test("token inesistente: stesso messaggio di link non valido", async ({ page }) => {
    // Nota: il backend non ha un concetto di scadenza temporale per questo
    // token (nessun campo di scadenza su Utente.tokenVerifica) - un token
    // "scaduto" e un token mai esistito producono lo stesso
    // TokenNonValidoException, verificato a codice in GestioneUtenti.verifyEmail.
    await page.goto("/conferma-email?token=token-mai-esistito-123");

    await expect(
      page.getByText("Il link di verifica non e' valido o e' gia' stato utilizzato.")
    ).toBeVisible();
  });

  test("token assente dalla query string: messaggio dedicato", async ({ page }) => {
    await page.goto("/conferma-email");

    await expect(page.getByText("Link di conferma non valido: manca il token.")).toBeVisible();
  });
});
