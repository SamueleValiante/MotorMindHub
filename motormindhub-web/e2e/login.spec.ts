import { test, expect, type TestRuolo } from "./fixtures";

test.describe("Login", () => {
  test("credenziali sbagliate: toast di errore, nessun redirect", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nessuno-e2e@example.com");
    await page.getByLabel("Password").fill("password-sbagliata");
    await page.getByRole("button", { name: "Accedi" }).click();

    await expect(page.getByText("Credenziali non valide.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("account non verificato: messaggio specifico, nessun redirect", async ({
    page,
    createTestUser,
  }) => {
    const { email, password } = await createTestUser({ unverified: true });

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Accedi" }).click();

    await expect(
      page.getByText(
        "Il tuo account non e' ancora stato verificato. Controlla la tua casella email per attivarlo."
      )
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  const roleRedirects: Array<[TestRuolo, string]> = [
    ["ISCRITTO", "/account"],
    ["AUTORE", "/autore"],
    ["MANAGER_AUTORI", "/manager"],
    ["GESTORE_UTENTI", "/gestore"],
  ];

  for (const [ruolo, path] of roleRedirects) {
    test(`login riuscito come ${ruolo} reindirizza a ${path}`, async ({
      page,
      createTestUser,
    }) => {
      const { email, password } = await createTestUser({ ruolo });

      await page.goto("/login");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Accedi" }).click();

      await expect(page).toHaveURL(new RegExp(`${path}$`));
    });
  }
});
